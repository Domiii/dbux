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
    return this._executingStack?.getImmediateDepth() || 0;
  }

  peekStack() {
    return this._executingStack?.peek() || null;
  }

  isExecuting() {
    return !!this._executingStack;
  }

  /**
   * We are now waiting for given context on current stack
   */
  _markWaiting(contextId) {
    this._executingStack.markWaiting();
    this._waitingStacks.set(contextId, this._executingStack);
  }

  _markResume(contextId) {
    this._executingStack.markResumed();
    this._waitingStacks.delete(contextId);
  }

  _popAnywhere(contextId) {
    const stack = this._executingStack;
    if (stack.peek() === contextId) {
      return stack.pop();
    }

    // we are popping a context that is not at the top of the stack,
    // meaning that all intermediate contexts are now in waiting
    const stackPos = stack.popNotTop(contextId);
    if (stackPos !== -1) {
      // all contexts between the one that got popped, and the current top are now in waiting
      for (let i = stack._stack.length - 1; i > stackPos; --i) {
        const id = stack._stack[i];
        // TODO: do some stack balancing
        
        // this._markWaiting(stack, id);
      }
    }
    return stackPos;
  }

  // ###########################################################################
  // Public methods
  // ###########################################################################

  registerAwait(awaitContextId) {
    if (!this.isExecuting()) {
      logInternalError('Encountered `await`, but there was no active stack ', awaitContextId);
      return;
    }

    this._markWaiting(awaitContextId);

    // NOTE: stack might keep popping before it actually pauses, so we don't unset executingStack quite yet.
  }

  resumeWaitingStack(contextId) {
    const waitingStack = this._waitingStacks.get(contextId);

    // TODO: try resume from this._interruptedStacksOfUnknownCircumstances!!

    if (!waitingStack) {
      logInternalError('Could not resume waiting stack (is not registered):', contextId);
      return null;
    }

    const oldStack = this._executingStack;
    this._executingStack = waitingStack;

    this._markResume(contextId);

    if (oldStack) {
      // ideally, this should not happen, since interrupts should always be resumed
      //    by the system scheduler
      mergeStacks(waitingStack, oldStack);
    }

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
      if (!stack) {
        logInternalError(`Could not pop contextId off stack`, contextId);
        return -1;
      }
      stackPos = this._popAnywhere(contextId);
    }
    else {
      // first check, if its on this stack, then check for waiting stacks
      stackPos = this._popAnywhere(contextId);
      if (stackPos === -1) {
        // it's not on this stack -> probably on a different stack?
        stack = this.resumeWaitingStack(contextId);
        if (!stack) {
          logInternalError(`Could not pop contextId off stack`, contextId);
          return -1;
        }
        stackPos = this._popAnywhere(contextId);
      }
    }

    if (stackPos === -1) {
      logInternalError(`Could not pop contextId off stack`, contextId);
      return -1;
    }
    // this._previousPoppedContextId = stackTop;

    if (stackPos === 0) {
      // popped root off stack
      if (stack.hasUnpoppedBusiness() && !stack.isWaiting()) {
        // there is stuff left to do on this stack, but we don't know why and how
        this._interruptedStacksOfUnknownCircumstances.push(stack);
      }
      // last on stack -> done with it! (for now...)
      if (stack === this._executingStack) {
        this._executingStack = null;
      }
      // this._previousPoppedContextId = null;
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