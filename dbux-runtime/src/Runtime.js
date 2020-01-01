import Stack from './Stack';
import { logInternalError } from './log/logger';

function mergeStacks(dst, src) {
  if ((src?.getDepth() || 0) > 0) {
    // TODO: our stacks don't keep track of their history.
    //  Instead, go into the collections and fix things there...?
    logInternalError('Trying to resume interrupted stack, but cannot currently merge stacks.');
  }
}

/**
 * Manages all actively running "runs" (represented by stacks).
 */
export default class Runtime {
  static _instance;
  /**
   * Singleton
   * @type {Runtime}
   */
  static get instance() {
    return this._instance || (this._instance = new Runtime());
  }

  /**
   * Set of all interrupted stacks.
   * @type {Map<int, Stack>}
   */
  _waitingStacks = new Map();

  /**
   * Mysterious stuff...
   */
  _interruptedStacksOfUnknownCircumstances = [];

  /**
   * The currently executing stack.
   * @type {Stack}
   */
  _executingStack = null;


  // ###########################################################################
  // Stack management
  // ###########################################################################

  _executeEmptyStackBarrier = () => {
    if (this._executingStack) {
      // we had an unhandled interruption (e.g. await, alert, prompt etc.)
      this.interrupt();
    }
  }

  /**
   * We currently have no good heuristics for checking whether we want to resume
   * an interrupted stack when pushing to an empty stack.
   * Instead, we need to rely on `_maybeResumeInterruptedStackOnPop` to try healing things
   * retroactively.
   */
  _maybeResumeInterruptedStackOnPushEmpty(contextId) {
    if (this._waitingStacks.has(contextId)) {
      // resume previous stack
      this.resumeWaitingStack(contextId);
    }
    else {
      // new stack
      this._executingStack = Stack.allocate();
    }
  }


  /**
   * Make sure to insert the "empty stack barrier" right after the current stack has fully unraveled.
   * TODO: In practice this is not perfect since some blackboxed mechanics might have called 
   * `setImmediate` beforehand, causing the current stack to be resumed in the wrong context.
   */
  _ensureEmptyStackBarrier() {
    if (!this._emptyStackBarrier) {
      this._emptyStackBarrier = setImmediate(this._executeEmptyStackBarrier);
    }
  }

  // ###########################################################################
  // Public getters
  // ###########################################################################

  getStackDepth() {
    return this._executingStack?.getDepth() || 0;
  }

  peekStack() {
    return this._executingStack?.peek() || null;
  }

  isExecuting() {
    return !!this._executingStack;
  }

  // ###########################################################################
  // Public methods
  // ###########################################################################

  registerAwait(awaitContextId) {
    if (!this.isExecuting()) {
      logInternalError('Encountered `await`, but there was no active stack ', awaitContextId);
      return;
    }

    this._executingStack.markWaiting();
    this._waitingStacks.set(awaitContextId, this._executingStack);

    // NOTE: stack might keep popping before it actually pauses, so we don't unset executingStack quite yet.
  }

  resumeWaitingStack(contextId) {
    const waitingStack = this._waitingStacks.get(contextId);

    // TODO: resume from this._interruptedStacksOfUnknownCircumstances!!

    if (!waitingStack) {
      logInternalError('Could not resume waiting stack (is not registered):', contextId);
      return null;
    }

    waitingStack.markResumed();
    this._waitingStacks.delete(contextId);

    if (this._executingStack) {
      // ideally, this should not happen, since interrupts should always be resumed
      //    by the system scheduler
      mergeStacks(waitingStack, this._executingStack);
    }

    this._executingStack = waitingStack;
    return waitingStack;
  }

  push(contextId) {
    if (!this._executingStack) {
      // no executing stack 
      //    -> this invocation has been called from system scheduler (possibly traversing blackboxed code)
      this._ensureEmptyStackBarrier();
      this._maybeResumeInterruptedStackOnPushEmpty(contextId);
    }
    // this._previousPoppedContextId = null;
    this._executingStack.push(contextId);
    // console.warn('->', contextId);
  }

  pop(contextId) {
    // console.warn('<-', contextId);
    let stack = this._executingStack;
    let stackPos;

    if (!stack) {
      // we probably had an unhandled interrupt that is now resumed
      stack = this.resumeWaitingStack(contextId);
      stackPos = stack.popAnywhere(contextId);
    }
    else {
      stackPos = stack.popAnywhere(contextId);
      if (stackPos === -1) {
        // it's not on this stack -> probably on a different stack?
        stack = this.resumeWaitingStack(contextId);
        if (!stack) {
          logInternalError(`Could not pop stack for contextId`, contextId);
          return -1;
        }
        stackPos = stack.popAnywhere(contextId);
      }
    }

    if (stackPos !== -1) {
      // this._previousPoppedContextId = stackTop;
      
      if (stackPos === 0) {
        // popped root off stack
        if (stack.hasUnpoppedBusiness() && !stack.isWaiting()) {
          // there is stuff left to do on this stack, but we don't know why and how
          this._interruptedStacksOfUnknownCircumstances.push(stack);
        }
        // last on stack -> done with it! (for now...)
        this._executingStack = null;
        // this._previousPoppedContextId = null;
      }
    }
    return stackPos;
  }

  /**
   * Put current stack into "wait queue"
   */
  interrupt() {
    if (!this._executingStack) {
      logInternalError('Tried to interrupt but there is no executing stack');
      return;
    }
    this._interruptedStacksOfUnknownCircumstances.push(this._executingStack);
    this._executingStack = null;
    // this._previousPoppedContextId = null;
  }
}