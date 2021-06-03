import { newLogger } from '@dbux/common/src/log/logger';
import asyncEventCollection from './data/asyncEventCollection.js';
import executionContextCollection from './data/executionContextCollection';
import traceCollection from './data/traceCollection';
import valueCollection from './data/valueCollection';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RuntimeThreads');

export class ExecutingStack {
  stack = [];

  constructor(stack = []) {
    this.stack = [...stack];
  }

  /**
   * Get the length of the executing stack.
   */
  length() {
    return this.stack.length;
  }

  /**
   * Push a context into executing stack.
   * @param {number} x Context id
   */
  push(x) {
    this.stack.push(x);
  }

  /**
   * Pop context `x` from executing stack.
   * Returns abandoned executing stack if `x` is not `top(1)`, `null` otherwise.
   * @param {number} x Context id
   * @return {ExecutingStack?}
   */
  pop(x) {
    if (this.stack[this.stack.length - 1] === x) {
      this.stack.pop();
      return null;
    } else {
      const index = this.stack.indexOf(x);
      if (index === -1) {
        // warn(`Trying to pop ${x} but not in execting stack: ${this.stack}, ignoring.`);
        return null;
      } else {
        const abandonedStack = this.stack.splice(index);
        this.stack.pop();

        return new ExecutingStack(abandonedStack);
      }
    }
  }

  /**
   * @param {number} z 
   * @returns {number} The top `z` excuting stack context 
   */
  top(z = 1) {
    return this.stack[this.stack.length - z];
  }
}

export class RuntimeThreadsStack {
  /**
   * @type {ExecutingStack} The current executing stack, filling with context id
   */
  currentStack = new ExecutingStack();

  /**
   * @type {Map<number, ExecutingStack>}
   */
  waitingStack = new Map();

  /**
   * Add a context id into the current stack
   * @param {number} contextId 
   */
  push(contextId) {
    this.currentStack.push(contextId);
  }  

  /**
   * Pop a context id from current stack
   * @param {number} contextId 
   */
  pop(contextId) {
    const abandonedStack = this.currentStack.pop(contextId);

    if (abandonedStack) {
      this.addWaitingStack(abandonedStack);
    }
  }

  /**
   * Add a stack into waiting stack.
   * @param {ExecutingStack} stack 
   */
  addWaitingStack(stack) {
    const lastContext = stack.top(1);
    this.waitingStack.set(lastContext, stack);
  }
  
  /**
   * Resume a stack with specific last context id back to executing stack
   * @param {number} x contextId
   */
  resumeWaitingStack(x) {
    const stack = this.waitingStack.get(x);
    if (!stack) {
      warn(`trying to resume a waiting stack with top = ${x} but not found.`);
    } else {
      if (this.currentStack.length !== 0) {
        warn(`trying to resume a waiting stack while there is still a stack with contexts executing. Put into waiting stack.`);
        this.addWaitingStack(this.currentStack);
      }

      this.currentStack = stack;
      this.waitingStack.delete(x);
    }
  }
}

export class RuntimeThreads2 {
  logger = newLogger('RuntimeThread2');

  promiseSet = new Set();
  promiseAwaitedSet = new Set();

  promiseCreatedInThisRunSet = new Set();
  promiseAwaitedInThisRunSet = new Set();
  promiseExecutionContextMap = new Map();

  recordMaybeNewPromise(promise, createAtRunId, createAtContext, contextIdInsidePromise) {
    if (this.promiseSet.has(promise)) {
      return;
    }

    this.promiseSet.add(promise);
    this.promiseCreatedInThisRunSet.add(promise);
    this.promiseExecutionContextMap.set(promise, { createAtContext, contextIdInsidePromise });
  }

  promiseAwaited(promise, awaitAtRunId) {
    if (this.promiseAwaitedSet.has(promise)) {
      // This promise is awaited previously
      return;
    }

    this.promiseAwaitedSet.add(promise);
    this.promiseAwaitedInThisRunSet.add(promise);
  }

  handleThreadData() {
    for (const promise of this.promiseCreatedInThisRunSet) {
      const { createAtContext, contextIdInsidePromise } = this.promiseExecutionContextMap.get(promise);
      if (this.promiseAwaitedInThisRunSet.has(promise)) {
        this.logger.debug(`context ${createAtContext} -> ${contextIdInsidePromise} not fork`);
        // not a fork
      } else {
        this.logger.debug(`context ${createAtContext} -> ${contextIdInsidePromise} fork`);
        // fork to different thread
      }
    }

    this.promiseCreatedInThisRunSet.clear();
    this.promiseAwaitedInThisRunSet.clear();
  }
}

export class RuntimeThreads1 {
  logger = newLogger('RuntimeThread1');

  preAwait(currentRunId, awaitArgument, resumeContextId, parentContextId) {
    this.logger.debug('pre await', awaitArgument);

    // this.floatingPromises.delete(awaitArgument);
    // this.logger.debug('delete floating promise', awaitArgument);

    if (awaitArgument instanceof Promise && (!this.isPromiseRecorded(awaitArgument) || this._runtime.isPromiseCreatedInRun(awaitArgument, currentRunId))) {
      const promise = awaitArgument;

      const isFirstAwait = this.isFirstContextInParent(resumeContextId, parentContextId);
      if (isFirstAwait) {
        this.storeFirstAwaitPromise(currentRunId, parentContextId, awaitArgument);
      } 

      // this.logger.debug('this promise', promise, 'first await', isFirstAwait, 'is root', this.isRootContext(parentContextId));
      if (!isFirstAwait || this.isRootContext(parentContextId)) {
        this.setOwnPromiseThreadId(promise, this.getRunThreadId(currentRunId));
      }
    }
  }

  postAwait(parentContextId, preEventContext, postEventContext, preEventRun, postEventRun) {
    if (this.getRunThreadId(postEventRun) === undefined) {
      const startThreadId = this.getRunThreadId(preEventRun);

      let edgeType = ''; // TODO change to enum

      if (this.isFirstContextInParent(preEventContext)) {
        const callerContextId = executionContextCollection.getById(preEventContext).contextId;
        const callerPromise = this.getContextReturnValue(callerContextId); // get return value
        const promiseThreadId = this.getPromiseThreadId(callerPromise);

        // this.logger.debug('in post await start thread id', startThreadId);
        // this.logger.debug('called promise', callerPromise, 'thread id', promiseThreadId);

        this.setRunThreadId(postEventRun, promiseThreadId);

        edgeType = this.getOwnPromiseThreadType(callerPromise);
      }
      else {
        edgeType = 'CHAIN';
      }

      this.addEdge(this.getLastRunOfThread(startThreadId), postEventRun, edgeType);

      // if (awaitArgument instanceof Promise) {
      //   get all last run bruh;
      // }
    }
  }

  floatingPromises = new Set();

  traceCall(contextId, calledContextId, trace, value) {
    const promiseRunId = this.getPromiseRunId(value);
    if (promiseRunId && promiseRunId !== this.getCurrentRunId()) {
      // this.logger.debug('promise not create in this run');
      return;
    }

    this.floatingPromises.add(value);

    const calledContextFirstPromise = this.getContextFirstAwaitPromise(calledContextId);

    this.recordContextReturnValue(contextId, calledContextId, value);

    if (calledContextFirstPromise) {
      this.storeAsyncCallPromise(this.getCurrentRunId(), calledContextId, trace.traceId, calledContextFirstPromise);
    }
  }

  cleanFloatingPromises() {
    const maintainPromiseThreadId = promise => {
      if (this.getOwnPromiseThreadId(promise)) {
        return this.getOwnPromiseThreadId(promise);
      }

      const callerPromise = this.getCallerPromise(promise);
      
      if (callerPromise) {
        const threadId = maintainPromiseThreadId(callerPromise);
        this.setOwnPromiseThreadId(promise, threadId);
        this.setOwnPromiseThreadType(promise, "CHAIN");
      } else {
        this._currentThreadId += 1;
        this.setOwnPromiseThreadId(promise, this._currentThreadId);
        this.setOwnPromiseThreadType(promise, "FORK");
      }

      return this.getOwnPromiseThreadId(promise);
    };

    for (let promise of this.floatingPromises) {
      maintainPromiseThreadId(promise);
    }

    this.floatingPromises.clear();
  }

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
    this.logger.debug('set run', runId, 'thread id', threadId);

    this.runToThreadMap.set(runId, threadId);
    this.threadLastRun.set(threadId, Math.max(runId, this.threadLastRun.get(threadId)));
  }

  /**
   * Get thread id of the given run id
   * @param {number} runId 
   */
  getRunThreadId(runId) {
    if (runId === 1) {
      // this.logger.debug("get run thread id", runId, "returns", 1);
      return 1;
    }
    // this.logger.debug("get run thread id", runId, "returns", this.runToThreadMap.get(runId));
    return this.runToThreadMap.get(runId);
  }

  /**
   * @type {number} Maintain thread count
   */
  _currentThreadId = 1;

  assignRunThreadId(runId, threadId) {
    this.setRunThreadId(runId, threadId);
    this.threadFirstRun.set(threadId, runId);
    this.threadLastRun.set(threadId, runId);
  }

  /**
   * Assign a new thread id to the run. Calls `setRunThreadId`
   * @param {number} runId 
   * @return The new thread id
   */
  assignRunNewThreadId(runId) {
    // this.logger.debug("assign run new thread id", runId);
    this._currentThreadId += 1;
    this.assignRunThreadId(runId, this._currentThreadId);
    return this._currentThreadId;
  }

  /**
   * Make an edge between `fromRun` and `toRun`, with type `edgeType`
   * @param {number} fromRun 
   * @param {number} toRun 
   * @param {string} edgeType should be either 'CHAIN' or 'FORK'
   */
  addEdge(fromRun, toRun, edgeType) {
    this.logger.debug(`Add edge from run ${fromRun} to ${toRun} type ${edgeType}`);

    if (edgeType === 'CHAIN' && this.getNextRunInChain(fromRun) !== null) {
      edgeType = 'FORK';

      warn("Trying to add CHAIN to an run already had outgoing CHAIN edge");
    }

    if (!this.getRunThreadId(fromRun)) {
      this.assignRunNewThreadId(fromRun);
    }

    if (edgeType === 'CHAIN') {
      if (!this.getRunThreadId(toRun)) {
        this.setRunThreadId(toRun, this.getRunThreadId(fromRun));
      }
    } else {
      if (!this.getRunThreadId(toRun)) {
        this.assignRunNewThreadId(toRun);
      }
    }

    if (!this.runGraph[fromRun]) {
      this.runGraph[fromRun] = new Map();
    }
    if (!this.invRunGraph[toRun]) {
      this.invRunGraph[toRun] = new Map();
    }

    this.runGraph[fromRun].set(toRun, edgeType);
    this.invRunGraph[toRun].set(fromRun, edgeType);

    asyncEventCollection.addEdge(fromRun, toRun, edgeType);
  }

  /**
   * Get last run of the thread, by `threadLastRun` map
   * @param {number} threadId 
   * @return {number} The last run id of the thread
   */
  getLastRunOfThread(threadId) {
    // this.logger.debug("get last run of thread", threadId, "returns", this.threadLastRun.get(threadId));
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

  setOwnPromiseThreadType(promise, type) {
    Object.assign(promise, { _dbux_threadType: type });
  }

  getOwnPromiseThreadId(promise) {
    return promise?._dbux_threadId;
  }

  getOwnPromiseThreadType(promise) {
    return promise?._dbux_threadType;
  }

  getPromiseThreadId(promise) {
    // this.logger.debug('get promise thread id', { promise });
    const threadId = this.getOwnPromiseThreadId(promise);
    if (threadId) {
      return threadId;
    }

    const callerPromise = this.getCallerPromise(promise);
    // this.logger.debug('caller promise', callerPromise);
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
    // this.logger.debug('get caller promise', promise);
    const contextId = this.returnValueCallerContextMap.get(promise);
    return this.contextReturnValueMap.get(contextId);
  }

  storeFirstAwaitPromise(runId, contextId, awaitArgument) {
    // this.logger.debug('store first await promise', runId, contextId, awaitArgument);
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


  isFirstContextInParent(contextId) {
    return executionContextCollection.isFirstContextInParent(contextId);
  }

  getContextFirstAwaitPromise(contextId) {
    return this._firstAwaitPromise.get(contextId);
  }

  _firstAwaitPromise = new Map();

  registerAwait(parentContext, awaitArgument) {
    if (this._firstAwaitPromise.get(parentContext) === undefined) {
      this._firstAwaitPromise.set(parentContext, awaitArgument);
    } 
  }

  contextReturnValueMap = new Map();
  returnValueCallerContextMap = new Map();
  recordContextReturnValue(callerContextId, contextId, value) {
    // this.logger.debug('set context return value', contextId, 'to', value);
    this.contextReturnValueMap.set(contextId, value);
    this.returnValueCallerContextMap.set(value, callerContextId);
  }

  getContextReturnValue(contextId) {
    // this.logger.debug('get context return value of context', contextId);
    return this.contextReturnValueMap.get(contextId);
  }
}