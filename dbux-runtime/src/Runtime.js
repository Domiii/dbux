
import { newLogger } from '@dbux/common/src/log/logger';
import Stack from './Stack';
import executionContextCollection from './data/executionContextCollection';
import traceCollection from './data/traceCollection';
import setImmediate from './setImmediate';
import valueCollection from './data/valueCollection.js';
import promiseCollection from './data/promiseCollection.js';


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

  _lastTraceByContextId = {};

  _bcesInByContextId = {};


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
      return this._bcesInByContextId[parentContextId];
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

    // const context = executionContextCollection.getById(contextId);
    // const staticContext = staticContextCollection.getById(context.staticContextId);
    // const name = staticContext.displayName || '';
    // const typeName = ExecutionContextType.nameFromForce(context.contextType);
    // console.debug('->', context.runId, contextId, `[${typeName}] ${name}`);
  }

  pop(contextId) {
    // const context = executionContextCollection.getById(contextId);
    // const staticContext = staticContextCollection.getById(context.staticContextId);
    // const name = staticContext.displayName || '';
    // const typeName = ExecutionContextType.nameFromForce(context.contextType);
    // console.debug('<-', context.runId, contextId, `[${typeName}] ${name}`);

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

      // last on stack -> done with it! (for now...)
      this._runFinished();
    }
    return stackPos;
  }

  // ###########################################################################
  // Complex scheduling
  // ###########################################################################

  _firstAwaitPromise = new Map();

  registerAwait(awaitContextId, parentContext, awaitArgument) {
    if (!this.isExecuting()) {
      logError('Encountered `await`, but there was no active stack ', awaitContextId);
      return;
    }

    this.push(awaitContextId, true);
    // this._markWaiting(awaitContextId);

    // NOTE: stack might keep popping before it actually pauses, so we don't unset executingStack quite yet.

    if (this._firstAwaitPromise.get(parentContext) === undefined) {
      this._firstAwaitPromise.set(parentContext, awaitArgument);
    } 
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
    ++this._currentRunId;
    this._executingStack = stack;
    // console.warn('[RunStart] ' + this._currentRunId); //, this.getLingeringStackCount());
    // console.time('[RunEnd] ' + this._currentRunId);
  }

  _runFinished() {
    this._executingStack = null;
    // console.warn('[RootEnd]', this._currentRootId, this.getLingeringStackCount());
    // console.timeEnd('[RunEnd] ' + this._currentRunId);
  }

  // ###########################################################################
  // async await promise
  // ###########################################################################

  runGraph = [];
  invRunGraph = [];

  runToThreadMap = new Map();
  threadFirstRun = new Map();
  threadLastRun = new Map([[1, 1]]);

  /**
   * Maintain `runToThreadMap` map and `threadId`'s last run in `threadLastRun` map
   * @param {number} runId 
   * @param {number} threadId 
   */
  setRunThreadId(runId, threadId) {
    this.runToThreadMap.set(runId, threadId);
    this.threadLastRun.set(threadId, Math.max(runId, this.threadLastRun.get(threadId)));
  }

  /**
   * Get thread id of the given run id
   * @param {number} runId 
   */
  getRunThreadId(runId) {
    if (runId === 1) {
      debug("get run thread id", runId, "returns", 1);
      return 1;
    }
    debug("get run thread id", runId, "returns", this.runToThreadMap.get(runId));
    return this.runToThreadMap.get(runId);
  }

  /**
   * @type {number} Maintain thread count
   */
  _currentThreadId = 0;

  /**
   * Assign a new thread id to the run. Calls `setRunThreadId`
   * @param {number} runId 
   * @return The new thread id
   */
  assignRunNewThreadId(runId) {
    this._currentThreadId += 1;
    this.setRunThreadId(runId, this._currentThreadId);
    this.threadFirstRun.set(this._currentThreadId, runId);
    this.threadLastRun.set(this._currentThreadId, runId);
    return this._currentThreadId;
  }

  /**
   * Make an edge between `fromRun` and `toRun`, with type `edgeType`
   * @param {number} fromRun 
   * @param {number} toRun 
   * @param {string} edgeType should be either 'CHAIN' or 'FORK'
   */
  addEdge(fromRun, toRun, edgeType) {
    debug(`Add edge from run ${fromRun} to ${toRun} type ${edgeType}`);

    if (edgeType === 'CHAIN' && this.getNextRunInChain(fromRun) !== null) {
      edgeType = 'FORK';

      warn("Trying to add CHAIN to an run already had outgoing CHAIN edge");
    }

    if (this.getRunThreadId(fromRun)) {
      this.assignRunNewThreadId(fromRun);
    }

    if (edgeType === 'CHAIN') {
      this.setRunThreadId(toRun, this.getRunThreadId(fromRun));
    } else {
      this.assignRunNewThreadId(toRun);
    }

    if (!this.runGraph[fromRun]) {
      this.runGraph[fromRun] = new Map();
    }
    if (!this.invRunGraph[toRun]) {
      this.invRunGraph[toRun] = new Map();
    }

    this.runGraph[fromRun].set(toRun, edgeType);
    this.invRunGraph[toRun].set(fromRun, edgeType);
  }

  /**
   * Get last run of the thread, by `threadLastRun` map
   * @param {number} threadId 
   * @return {number} The last run id of the thread
   */
  getLastRunOfThread(threadId) {
    debug("get last run of thread", threadId, "returns", this.threadLastRun.get(threadId));
    return this.threadLastRun.get(threadId);
  }

  getNextRunInChain(runId) {
    for (let [toRun, edgeType] of this.runGraph[runId] || []) {
      if (edgeType === 'CHAIN') {
        return toRun;
      }
    }
    return null;
  }

  setOwnPromiseThreadId(promise, threadId) {
    Object.assign(promise, { _dbux_threadId: threadId });
  }

  getOwnPromiseThreadId(promise) {
    return promise?._dbux_threadId;
  }

  getPromiseThreadId(promise) {
    debug('get promise thread id', { promise });
    const threadId = this.getOwnPromiseThreadId(promise);
    if (threadId) {
      return threadId;
    }

    const callerPromise = this.getCallerPromise(promise);
    debug('caller promise', callerPromise);
    if (callerPromise) {
      return this.getPromiseThreadId(callerPromise);
    }

    return undefined;
  }

  promiseContextMap = new Map();
  contextPromiseMap = new Map();

  /**
   * Given a promise, return the return value of the context that await this promise
   * @param {Promise} promise 
   * @returns 
   */
  getCallerPromise(promise) {
    debug('get caller promise', promise);
    const contextId = this.returnValueCallerContextMap.get(promise);
    return this.contextReturnValueMap.get(contextId);
  }

  storeFirstAwaitPromise(runId, contextId, awaitArgument) {
    debug('store first await promise', runId, contextId, awaitArgument);
    const pair = { runId, contextId };
    this.promiseContextMap.set(awaitArgument, pair);
    this.contextPromiseMap.set(pair, awaitArgument);
    // TOD: seems like useless
  }

  getTraceValue(trace) {
    if (trace.value) {
      return trace.value;
    }

    if (trace.valueId) {
      return valueCollection.getById(trace.valueId).value;
    }

    return undefined;
  }

  getAsyncCallerPromise(promise) {
    const callerTrace = this.getAsyncPromiseCallerTrace(promise);
    const callerPromise = this.getTraceValue(callerTrace);

    if (this.getPromiseRunId(callerPromise) === this.getPromiseRunId(promise)) {
      return callerPromise;
    }

    throw new Error('Something shouldn\'t happen: we are only looking this up in case of a first await');
    return null;
  } 

  getAsyncPromiseCallerTrace(promise) {
    return traceCollection.getById(this.runContextTraceCallPromiseMap.get(promise).traceId);
  }

  getPromiseRunId(promise) {
    return promise._dbux_runId;
  }

  isPromiseCreatedInRun(promise, runId = this.getCurrentRunId()) {
    return this.getPromiseRunId(promise) === runId;
  }

  isPromiseRecorded(promise) {
    return !!this.getPromiseRunId(promise);
  }

  isRootContext(contextId) {
    return !executionContextCollection.getById(contextId).parentContextId;
  }

  runContextTraceCallPromiseMap = new Map();
  promiseRunContextTraceMap = new Map();
  storeAsyncCallPromise(runId, contextId, traceId, promise) {
    Object.assign(promise, { _dbux_runId: runId });
    const key = { runId, contextId, traceId };
    this.runContextCallTracePromiseMap.set(key, promise);
    this.promiseRunContextTraceMap.set(promise, key);
  }

  _lastPoppedContextId = null;
  getLastPoppedContextId() {
    return this._lastPoppedContextId;
  }

  isFirstContextInParent(contextId) {
    return executionContextCollection.isFirstContextInParent(contextId);
  }

  getContextFirstAwaitPromise(contextId) {
    return this._firstAwaitPromise.get(contextId);
  }

  contextReturnValueMap = new Map();
  returnValueCallerContextMap = new Map();
  recordContextReturnValue(callerContextId, contextId, value) {
    debug('set context return value', contextId, 'to', value);
    this.contextReturnValueMap.set(contextId, value);
    this.returnValueCallerContextMap.set(value, callerContextId);
  }

  getContextReturnValue(contextId) {
    debug('get context return value of context', contextId);
    return this.contextReturnValueMap.get(contextId);
  }
}