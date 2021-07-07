
import { newLogger } from '@dbux/common/src/log/logger';
import Stack from './Stack';
import traceCollection from './data/traceCollection';
import scheduleNextPossibleRun from './scheduleNextPossibleRun';
import { RuntimeThreads1, RuntimeThreads2 } from './RuntimeThreads';

// import ExecutionContextType from '@dbux/common/src/core/constants/ExecutionContextType';
// import executionContextCollection from './data/executionContextCollection';
// import staticContextCollection from './data/staticContextCollection';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Runtime');

// function mergeStacks(dst, src) {
//   if ((src?.getDepth() || 0) > 0) {
//     // this should actually never be necessary
//     logError('Trying to resume interrupted stack, but there was already .');
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
  _maxRunId = 0;

  _lastTraceByContextId = {};

  _bcesInByContextId = {};

  // _runtimeThreadStack = new RuntimeThreadsStack();
  thread1 = new RuntimeThreads1(this);
  thread2 = new RuntimeThreads2();

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
      // console.warn('interrupt');
      this.interrupt();
    }
    this._emptyStackBarrier = null;

    this.thread1.processFloatingPromises();
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
        warn('found mysterious stack for contextId:', contextId);
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
      this._emptyStackBarrier = scheduleNextPossibleRun(this._executeEmptyStackBarrier);
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
  
  setLastContextTrace(contextId, traceId) {
    this._lastTraceByContextId[contextId] = traceId;
  }

  addBCEForContext(contextId, traceId) {
    let bceStack = this._bcesInByContextId[contextId];
    if (!bceStack) {
      bceStack = this._bcesInByContextId[contextId] = [];
    }
    bceStack.push(traceId);
  }

  /**
   * Determine `parentTraceId` (which trace pushed which context).
   */
  getParentTraceId() {
    const parentContextId = this.peekCurrentContextId();
    const lastTraceId = this.getLastTraceInContext(parentContextId);
    const lastTrace = traceCollection.getById(lastTraceId);
    if (lastTrace?.callId) {
      // last trace was a parameter or a BCE -> return BCE
      // return this._bcesInByContextId[parentContextId];
      return lastTrace?.callId;
    }

    // this context was probably not created by a call.
    //    it was probably a getter, proxy trap etc.
    //    in this case, just assume that the parent is the last trace.
    return lastTraceId;
  }

  /**
   * Determine whether an error happened, by checking whether this dynamic last trace is an actual exit trace for a function.
   * NOTE: `Pop`s are not recorded here! (as that would mess with that goal)
   */
  getLastTraceInContext(contextId) {
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

  getMaxRunId() {
    return this._maxRunId;
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

    // this._runtimeThreadStack.push(contextId);

    if (isInterruptable) {
      // start with a resume context
      this._markWaiting(contextId);
    }

    // const context = executionContextCollection.getById(contextId);
    // const staticContext = staticContextCollection.getById(context.staticContextId);
    // const name = staticContext.displayName || '';
    // const typeName = ExecutionContextType.nameFromForce(context.contextType);
    // console.debug(`-> ${context.runId} ${contextId} [${typeName}] ${name}`);
  }

  pop(contextId) {
    // const context = executionContextCollection.getById(contextId);
    // const staticContext = staticContextCollection.getById(context.staticContextId);
    // const name = staticContext.displayName || '';
    // const typeName = ExecutionContextType.nameFromForce(context.contextType);
    // console.debug(`<- ${context.runId} ${contextId} [${typeName}] ${name}`);

    // this._runtimeThreadStack.pop(contextId);

    this._lastPoppedContextId = contextId;

    let stack = this._executingStack;
    let stackPos;

    if (!stack) {
      // we probably had an unhandled interrupt that is now resumed
      stack = this.resumeWaitingStack(contextId);
      if (!stack) {
        logError(`Could not pop contextId off stack because there is stack active, and no waiting stack registered with this contextId`, contextId);
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
          logError(`Could not pop contextId off stack`, contextId);
          return -1;
        }
        stackPos = this._popAnywhere(contextId);
      }
    }

    if (stackPos === -1) {
      logError(`Could not pop contextId off stack`, contextId);
      return -1;
    }

    if (stackPos === 0) {
      // popped root off stack
      if (stack.getUnpoppedCount() && !stack.hasWaiting()) {
        // there is stuff left to do on this stack, but we don't know why and how
        this._interruptedStacksOfUnknownCircumstances.push(stack);
      }

      // TODO: our shadow stack is not accurate enough for this to work correctly
      // this._runFinished();
    }
    return stackPos;
  }

  _lastPoppedContextId = null;
  getLastPoppedContextId() {
    return this._lastPoppedContextId;
  }

  // ###########################################################################
  // Complex scheduling
  // ###########################################################################

  /**
   * NOTE: we use this to make sure that every `postAwait` event has its own `run`.
   */
  newRun() {
    this._currentRunId = ++this._maxRunId;
    debug(`newRun`, this._currentRunId);
    return this._currentRunId;
  }

  registerAwait(awaitContextId, parentContext, awaitArgument) {
    if (!this.isExecuting()) {
      logError('Encountered `await`, but there was no active stack ', awaitContextId);
      return;
    }

    this.push(awaitContextId, true);
    // this._markWaiting(awaitContextId);

    // NOTE: stack might keep popping before it actually pauses, so we don't unset executingStack quite yet.

    this.thread1.registerAwait(parentContext, awaitArgument);
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
      logError('Could not resume waiting stack (is not registered):', contextId);
      return null;
    }

    // waitingStack.resumeFrom(contextId);
    const oldStack = this._executingStack;

    // console.log(oldStack, waitingStack);

    if (oldStack !== waitingStack) {
      if (this.isExecuting()) {
        logError('`resume` received while already executing not handled properly yet. Discarding executing stack.');
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
      logError('Tried to interrupt but there is no executing stack');
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
    this.newRun();
    this._executingStack = stack;
    // console.warn('[RunStart] ' + this._currentRunId, new Error().stack); //, this.getLingeringStackCount());
    // console.time('[RunEnd] ' + this._currentRunId);
  }

  _runFinished() {
    this._executingStack = null;
    const maxRunId = this.getMaxRunId();
    for (let runId = (this._lastSavedRun || 0) + 1; runId <= maxRunId; ++runId) {
      this.thread1.postRun(runId);
      this.thread2.postRun();
    }
    this._lastSavedRun = maxRunId;
    // console.warn('[RunEnd]', this._currentRootId, this.getLingeringStackCount(), new Error().stack);
    // console.timeEnd('[RunEnd] ' + this._currentRunId);
  }
}
