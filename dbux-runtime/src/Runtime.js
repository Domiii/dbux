import { logInternalError } from 'dbux-common/src/log/logger';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';
import Stack from './Stack';
import executionContextCollection from './data/executionContextCollection';
import staticContextCollection from './data/staticContextCollection';

// function mergeStacks(dst, src) {
//   if ((src?.getDepth() || 0) > 0) {
//     // this should actually never be necessary
//     logInternalError('Trying to resume interrupted stack, but there was already .');
//   }
// }

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
   * @type {Stack[]}
   */
  _interruptedStacksOfUnknownCircumstances = [];

  /**
   * The currently executing stack.
   * @type {Stack}
   */
  _executingStack = null;

  /**
   * Used for root management
   */
  _currentRunId = 0;

  _lastTraceByContextId = [];


  // ###########################################################################
  // Stack management
  // ###########################################################################

  /**
   * The amount of stacks that are waiting or were interrupt and are still kicking around
   */
  getLingeringStackCount() {
    return this._waitingStacks.size + this._interruptedStacksOfUnknownCircumstances.length;
  }

  _executeEmptyStackBarrier = () => {
    if (this._executingStack) {
      // we had an unhandled interrupt (should never happen?)
      console.warn('interrupt');
      this.interrupt();
    }
    this._emptyStackBarrier = null;
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
      const mysteriousStack = this._interruptedStacksOfUnknownCircumstances.find(stack => stack._stack.includes(contextId));
      if (mysteriousStack) {
        console.warn('found mysterious stack for contextId:', contextId);
        this._runStart(mysteriousStack);
      }
      else if (!this._executingStack) {
        this.newStack();
      }
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

    // we are popping a context that is not at the top nor peek of the stack,
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
  // Traces
  // ###########################################################################
  
  setContextTrace(contextId, traceId) {
    this._lastTraceByContextId[contextId] = traceId;
  }

  getContextTraceId(contextId) {
    return this._lastTraceByContextId[contextId];
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

  getCurrentRunId() {
    return this._currentRunId;
  }

  // /**
  //  * Looks up the stack until it finds a context that is Immediate.
  //  */
  // getRealParentContextId() {
  //   if (!this._executingStack) {
  //     return null;
  //   }

  //   for (const i = this._executingStack.getPeekIndex(); --i; i >= 0) {
  //     const contextId = this._executingStack._stack[i];
  //     const context = ;
  //     if (contextId) {

  //     }
  //   }

  //   return null;
  // }

  peekCurrentContextId() {
    return this._executingStack?.peek() || null;
  }

  // ###########################################################################
  // Push + Pop basics
  // ###########################################################################

  beforePush(contextId) {
    this._ensureEmptyStackBarrier();
    this._maybeResumeInterruptedStackOnPushEmpty(contextId);

    // TODO: when unconditionally overriding current context, traces receive incorrect `contextId`
    //  -> do we need to set peek to contextId? for what?

    // if (contextId) {
    //   this._executingStack.trySetPeek(contextId);
    // }
    // }
  }

  push(contextId, isInterruptable = false) {
    // this._previousPoppedContextId = null;
    this._executingStack.push(contextId);

    if (isInterruptable) {
      // start with a resume context
      this._markWaiting(contextId);
    }

    const context = executionContextCollection.getById(contextId);
    const staticContext = staticContextCollection.getById(context.staticContextId);
    const name = staticContext.displayName || '';
    const typeName = ExecutionContextType.nameFromForce(context.contextType);
    console.debug('->', context.runId, contextId, `[${typeName}] ${name}`);
  }

  pop(contextId) {
    const context = executionContextCollection.getById(contextId);
    const staticContext = staticContextCollection.getById(context.staticContextId);
    const name = staticContext.displayName || '';
    const typeName = ExecutionContextType.nameFromForce(context.contextType);
    console.debug('<-', context.runId, contextId, `[${typeName}] ${name}`);

    let stack = this._executingStack;
    let stackPos;

    if (!stack) {
      // we probably had an unhandled interrupt that is now resumed
      stack = this.resumeWaitingStack(contextId);
      if (!stack) {
        logInternalError(`Could not pop contextId off stack because there is stack active, and no waiting stack registered with this contextId`, contextId);
        return -1;
      }
      stackPos = this._popAnywhere(contextId);
    }
    else {
      // first check, if its on this stack, then check for waiting stacks
      stackPos = this._popAnywhere(contextId);
      if (stackPos === -1) {
        // it's not on this stack -> probably coming back from an unhandled interrupt (probably should never happen?)
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
      this._runFinished();
    }
    return stackPos;
  }

  // ###########################################################################
  // Complex scheduling
  // ###########################################################################

  registerAwait(awaitContextId) {
    if (!this.isExecuting()) {
      logInternalError('Encountered `await`, but there was no active stack ', awaitContextId);
      return;
    }

    this.push(awaitContextId, true);
    // this._markWaiting(awaitContextId);

    // NOTE: stack might keep popping before it actually pauses, so we don't unset executingStack quite yet.
  }

  /**
   * Manually climb up the stack.
   * NOTE: We are waiting now, and see on the stack:
   *    1. Await (top)
   *    2. async function (top-1)
   * -> However, next trace will be outside of the function, so we want to skip both.
   */
  skipPopPostAwait() {
    this._executingStack._peekIdx -= 2;
  }

  /**
   * no previous executing stack to resume
   *  -> this invocation has been called from system scheduler (possibly traversing blackboxed code)
   */
  newStack() {
    // if (!this._executingStack) {
    const newStack = Stack.allocate();
    this._runStart(newStack);
  }

  resumeWaitingStack(contextId) {
    const waitingStack = this._waitingStacks.get(contextId);
    if (!waitingStack) {
      logInternalError('Could not resume waiting stack (is not registered):', contextId);
      return null;
    }

    // waitingStack.resumeFrom(contextId);
    const oldStack = this._executingStack;

    if (oldStack !== waitingStack) {
      if (this.isExecuting()) {
        logInternalError('`resume` received while already executing not handled properly yet. Discarding executing stack.');
        this.interrupt();
      }

      this._runStart(waitingStack);
    }

    this._markResume(contextId);

    // pop the await/yield context
    this.pop(contextId);

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

    this._runFinished();
    // this._previousPoppedContextId = null;
  }

  // ###########################################################################
  // Manage "execution roots"
  // ###########################################################################

  _runStart(stack) {
    ++this._currentRunId;
    this._executingStack = stack;
    console.warn('[RunStart] ' + this._currentRunId); //, this.getLingeringStackCount());
    console.time('[RunEnd] ' + this._currentRunId);
  }

  _runFinished() {
    this._executingStack = null;
    // console.warn('[RootEnd]', this._currentRootId, this.getLingeringStackCount());
    console.timeEnd('[RunEnd] ' + this._currentRunId);
  }
}