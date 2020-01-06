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
 * Manages the executing as well as all interrupted stacks.
 * Does not interact with database.
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
    else if (!this._executingStack) {
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
  /**
   * We are now waiting for given context on current stack
   */
  _markWaiting(contextId) {
    if (!this._waitingStacks.has(contextId)) {
      this._executingStack.markWaiting();
      this._waitingStacks.set(contextId, this._executingStack);
    }
  }

  _markResume(contextId) {
    this._executingStack.markResumed();
    this._waitingStacks.delete(contextId);
    // console.warn('<-', contextId);
  }

  _onPop(contextId) {
    if (this._waitingStacks.has(contextId)) {
      this._markResume(contextId);
    }
  }

  /**
   * NOTE: in JS, we might pop a context that is not on top; intermediate contexts are in waiting
   */
  _popAnywhere(contextId) {
    const stack = this._executingStack;
    if (stack.isAtTop(contextId)) {
      this._onPop(contextId);
      return stack.popTop();
    }
    if (stack.isAtPeek(contextId)) {
      this._onPop(contextId);
      return stack.popPeekNotTop();
    }

    // we are popping a context that is not at the top of the stack,
    // meaning that all intermediate contexts are now in waiting
    const oldPeekIdx = stack.getPeekIndex();
    const stackPos = stack.popOther(contextId);
    if (stackPos !== -1) {
      this._onPop(contextId);

      // all contexts between the one that got popped, and the old peek are now considered "in waiting"
      for (let i = stackPos; i < oldPeekIdx; ++i) {
        const intermediateContextId = stack._stack[i];
        if (!stack.isPoppedButStillAround(intermediateContextId)) {
          // mark as waiting, if it wasn't already popped
          this._markWaiting(intermediateContextId);
        }
      }
    }
    return stackPos;
  }

  // ###########################################################################
  // Public getters
  // ###########################################################################

  isExecuting() {
    return !!this._executingStack;
  }

  getStackDepth() {
    return this._executingStack?.getDepth() || 0;
  }

  peekCurrentContextId() {
    return this._executingStack?.peek() || null;
  }

  // ###########################################################################
  // Push + Pop basics
  // ###########################################################################

  beforePush(contextId) {
    // if (!this._executingStack) {
    // no executing stack 
    //    -> this invocation has been called from system scheduler (possibly traversing blackboxed code)
    this._ensureEmptyStackBarrier();
    this._maybeResumeInterruptedStackOnPushEmpty(contextId);

    if (contextId) {
      this._executingStack.trySetPeek(contextId);
    }
    // }
  }

  push(contextId) {
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
        // it's not on this stack -> probably coming back from an unhandled interrupt
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

    if (stackPos === 0) {
      // popped root off stack
      if (stack.getUnpoppedCount() && !stack.hasWaiting()) {
        // there is stuff left to do on this stack, but we don't know why and how
        this._interruptedStacksOfUnknownCircumstances.push(stack);
      }
      // last on stack -> done with it! (for now...)
      this._executingStack = null;
    }
  }

  // ###########################################################################
  // Complex scheduling
  // ###########################################################################

  scheduleCallback(contextId) {
    if (!this.isExecuting()) {
      logInternalError('Trying to `scheduleCallback`, but there was no active stack ', contextId);
      return;
    }

    this._markWaiting(contextId);
  }

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
    if (!waitingStack) {
      // TODO: try resume from this._interruptedStacksOfUnknownCircumstances!!
      logInternalError('Could not resume waiting stack (is not registered):', contextId);
      return null;
    }
    const oldStack = this._executingStack;

    if (oldStack !== waitingStack) {
      if (this.isExecuting()) {
        // logInternalError('Unexpected: `postAwait` received while already executing');
        this.interrupt();
      }
      this._executingStack = waitingStack;

      // ideally, this should not happen, since interrupts should always be resumed
      //    by the system scheduler
      mergeStacks(waitingStack, oldStack);
    }

    this._markResume(contextId);

    return waitingStack;
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