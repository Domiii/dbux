import { newLogger } from '@dbux/common/src/log/logger';
import isPromise from '@dbux/common/src/util/isPromise';
import asyncEventCollection from './data/asyncEventCollection';
import executionContextCollection from './data/executionContextCollection';
import runCollection from './data/runCollection';
import traceCollection from './data/traceCollection';
import valueCollection from './data/valueCollection';

/** @typedef { import("./Runtime").default } Runtime */

function setPromiseData(promise, data) {
  let { _dbux_ } = promise;
  if (!_dbux_) {
    Object.defineProperty(promise, '_dbux_', _dbux_ = {
      value: {
        ..._dbux_,
        ...data
      },
      writable: true,
      enumerable: false,
      configurable: false
    });
  }
  Object.assign(_dbux_, data);
}

function getPromiseRunId(promise) {
  return promise._dbux_?.runId;
}

function getOwnPromiseThreadId(promise) {
  return promise?._dbux_?.threadId;
}

function getOwnPromiseEdgeType(promise) {
  return promise?._dbux_?.edgeType;
}

function getOwnPromiseChainedToRoot(promise) {
  return promise?._dbux_?.chainedToRoot;
}


export class RuntimeThreads2 {
  logger = newLogger('RuntimeThread2');

  promiseSet = new WeakSet();
  promiseAwaitedSet = new WeakSet();

  promiseCreatedInThisRunSet = new WeakSet();
  promiseAwaitedInThisRunSet = new WeakSet();
  promiseExecutionContextMap = new WeakMap();

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

  postRun() {
    // for (const promise of this.promiseCreatedInThisRunSet) {
    //   const { createAtContext, contextIdInsidePromise } = this.promiseExecutionContextMap.get(promise);
    //   if (this.promiseAwaitedInThisRunSet.has(promise)) {
    //     this.logger.debug(`context ${createAtContext} -> ${contextIdInsidePromise} not fork`);
    //     // not a fork
    //   } else {
    //     this.logger.debug(`context ${createAtContext} -> ${contextIdInsidePromise} fork`);
    //     // fork to different thread
    //   }
    // }

    this.promiseCreatedInThisRunSet.clear();
    this.promiseAwaitedInThisRunSet.clear();
  }
}

export class RuntimeThreads1 {
  logger = newLogger('Threads');
  floatingPromises = [];

  outEdges = [];
  inEdges = [];

  runToThreadMap = new Map();
  threadFirstRun = new Map();
  threadLastRootContext = new Map([[1, 1]]);

  /**
   * @type {number} Maintain thread count
   */
  _currentThreadId = 1;
  // contextReturnValueMap = new Map();
  // returnValueCallerContextMap = new Map();

  beforeAwaitContext = new Map();
  beforeAwaitRun = new Map();

  _firstAwaitPromise = new Map();
  promiseContextMap = new Map();
  contextPromiseMap = new Map();
  runContextTraceCallPromiseMap = new Map();
  promiseRunContextTraceMap = new Map();

  /**
   * @type {Runtime}
   */
  _runtime;

  constructor(runtime) {
    this._runtime = runtime;
  }

  getCurrentRunId() {
    return this._runtime.getCurrentRunId();
  }

  // ###########################################################################
  // preAwait
  // ###########################################################################

  /**
   * Track any created promise (that is the return value of a function or ctor call).
   */
  traceCallPromiseResult(contextId, calledContextId, trace, promise) {
    const promiseRunId = getPromiseRunId(promise);
    if (promiseRunId && promiseRunId !== this.getCurrentRunId()) {
      this.logger.warn('promise not created in this run', promiseRunId, promise);
      return;
    }

    this.recordFloatingPromise(promise);

    const calledContextFirstPromise = this.getContextFirstAwaitPromise(calledContextId);
    if (calledContextFirstPromise) {
      // TODO: this is not necessarily an "async call promise"
      this.storeAsyncCallPromise(this.getCurrentRunId(), calledContextId, trace.traceId, calledContextFirstPromise);
    }

    // this.recordContextReturnValue(calledContextId, promise);
  }

  preAwait(currentRunId, awaitArgument, resumeContextId, parentContextId) {
    // this.logger.debug('pre await', awaitArgument);

    // this.floatingPromises.delete(awaitArgument);
    // this.logger.debug('delete floating promise', awaitArgument);
    this.beforeAwaitContext.set(parentContextId, resumeContextId);
    this.beforeAwaitRun.set(parentContextId, currentRunId);

    if (isPromise(awaitArgument) &&
      (!this.isPromiseRecorded(awaitArgument) || this._runtime.isPromiseCreatedInRun(awaitArgument, currentRunId))
    ) {
      const promise = awaitArgument;

      const isFirstAwait = this.isFirstContextInParent(resumeContextId, parentContextId);
      if (isFirstAwait) {
        this.storeFirstAwaitPromise(currentRunId, parentContextId, awaitArgument);
      }

      // this.logger.debug('this promise', promise, 'first await', isFirstAwait, 'is root', this.isRootContext(parentContextId));
      if (!isFirstAwait || this.isRootContext(parentContextId)) {
        this.setupPromise(promise, this.getRunThreadId(currentRunId), 'CHAIN', true);
      }
    }
  }

  recordFloatingPromise(promise) {
    this.floatingPromises.push(promise);
  }


  // ###########################################################################
  // postAwait
  // ###########################################################################

  postAwait(realContextId, postEventContext, awaitArgument) {
    const preEventContext = this.beforeAwaitContext.get(realContextId);
    const preEventRun = this.beforeAwaitRun.get(realContextId);

    this.logger.debug(`postAwait ${preEventRun}->${postEventRun}`);

    const startThreadId = this.getRunThreadId(preEventRun);

    let edgeType = ''; // TODO change to enum

    if (this.getLastRootContextOfThread(startThreadId) === postEventRun) {
      this.logger.warn(
        `[postAwait] tried to handle postEventRun more than once for thread`, startThreadId, `with startRun === endRun. Type=${edgeType}, ` +
      `runs=${this.debugGetAllRunsOfThread(startThreadId)} (Skipped).`
      );
    }
    else {
      let fromRootContextId;
      const isNested = isPromise(awaitArgument);
      let threadId;
      if (isNested) {
        // nested await argument
        threadId = this.getPromiseThreadId(awaitArgument);
        fromRootContextId = this.getLastRootContextOfThread(threadId);
        edgeType = 'CHAIN';
      }
      else {
        // chain depends on caller semantics
        fromRootContextId = preEventRun;

        // // assign run <-> threadId
        // NOTE: this should probably not happen
        // let fromRootContextIdThreadId = this.getRunThreadId(fromRootContextId);
        // if (!fromRootContextIdThreadId) {
        //   // this.logger.debug("From run", fromRootContextId, "is a new run, assign thread id");
        //   fromRootContextIdThreadId = this.assignRunNewThreadId(fromRootContextId);
        // }

        if (this.isFirstContextInParent(preEventContext)) {
          // -> not nested, first await
          //      -> this makes it the "inner-most" "first await"
          const callerContextId = executionContextCollection.getById(preEventContext).contextId;
          const callerPromise = this.getAsyncCallerPromise(callerContextId); // get return value
          // const isChainedToRoot = this.getPromiseChainedToRoot(callerPromise);

          threadId = this.getPromiseThreadId(callerPromise);
          edgeType = this.getPromiseEdgeType(callerPromise);
          // if (!isChainedToRoot) {
          //   threadId = this.getPromiseThreadId(callerPromise);
          //   edgeType = this.getPromiseEdgeType(callerPromise);
          // }
          // else {
          //   threadId = this.getRunThreadId(preEventRun);
          //   edgeType = 'CHAIN';
          // }
        }
        else {
          threadId = this.getRunThreadId(preEventRun);
          edgeType = 'CHAIN';
        }
      }

      if (!this.getRunThreadId(postEventRun)) {
        this.setRunThreadId(postEventRun, threadId);
      }

      // add edge
      this.logger.debug(`[${edgeType === 'FORK' ? `${startThreadId}->` : ''}${threadId}] ${edgeType} - Runs: ${fromRootContextId}->${postEventRun} (${isNested ? `nested` : ''})`);
      this.addEdge(fromRootContextId, postEventRun, edgeType);
    }
  }

  /**
   * This is called `postRun` to process promises that are return values of `async` functions.
   */
  processFloatingPromises() {
    // this.logger.debug('clean flating promise');
    const maintainPromiseThreadIdDfs = promise => {
      // this.logger.debug('do promise', promise);

      console.warn(`floatingPromise`, promise, this.getAsyncCallerPromise(promise));

      if (getOwnPromiseThreadId(promise)) {
        // this.logger.debug('get own thread id', getOwnPromiseThreadId(promise));
        return getOwnPromiseThreadId(promise);
      }
      const callerPromise = this.getAsyncCallerPromise(promise);

      if (callerPromise) {
        // this promise participates in an await chain. Does not have "own" threadId.
        maintainPromiseThreadIdDfs(callerPromise);
        // this.setupPromise(callerPromise, threadId, 'CHAIN');
      } else {
        // floating promise is not bound to root context, and has no further caller
        const threadId = this.newThreadId();
        this.setupPromise(promise, threadId, 'FORK', false);
      }
      // this.logger.debug('promise become', promise);
      return getOwnPromiseThreadId(promise);
    };
    for (let promise of this.floatingPromises) {
      maintainPromiseThreadIdDfs(promise);
    }
    this.floatingPromises = [];
    // this.logger.debug("end clean");
  }


  // ###########################################################################
  // runs
  // ###########################################################################

  /**
   * Used for debugging purposes.
   */
  debugGetAllRunsOfThread(threadId) {
    return Array.from(this.runToThreadMap.entries())
      .filter(([, t]) => t === threadId)
      .map(([r]) => r);
  }

  /**
   * Called when a run is finished.
   * @param {number} runId 
   */
  postRun(runId) {
    const threadId = this.getRunThreadId(runId);

    runCollection.addRun(runId, threadId);
  }

  /**
   * Maintain `runToThreadMap` map and `threadId`'s last run in `threadLastRun` map
   * @param {number} runId 
   * @param {number} threadId 
   */
  setRunThreadId(runId, threadId) {
    const threadLastRun = Math.max(runId, this.threadLastRootContext.get(threadId) || 0);
    // this.logger.debug(`[${threadId}] set runId=${runId}, threadLastRun=${threadLastRun}`);

    this.runToThreadMap.set(runId, threadId);
    this.threadLastRootContext.set(threadId, threadLastRun);
  }

  /**
   * Get thread id of the given run id
   * @param {number} runId 
   */
  getRunThreadId(runId) {
    if (runId === 1) {
      return 1;
    }
    return this.runToThreadMap.get(runId);
  }

  /**
   * @return The new thread id
   */
  newThreadId() {
    // this.logger.debug("assign run new thread id", runId);
    ++this._maxThreadId;
    console.trace('newThreadId', this._maxThreadId);
    return this._maxThreadId;
  }

  /**
   * Make an edge between `fromRootContextId` and `toRootContextId`, with type `edgeType`
   * @param {number} fromRootContextId 
   * @param {number} toRootContextId 
   * @param {string} edgeType should be either 'CHAIN' or 'FORK'
   */
  addEdge(fromRootContextId, toRootContextId, edgeType) {
    if (edgeType === 'CHAIN' && getNextRunInChain(fromRootContextId) !== null) {
      edgeType = 'FORK';

      // warn("Trying to add CHAIN to an run already had outgoing CHAIN edge");
    }

    if (!this.outEdges[fromRootContextId]) {
      this.outEdges[fromRootContextId] = new Map();
    }
    if (!this.inEdges[toRootContextId]) {
      this.inEdges[toRootContextId] = new Map();
    }

    this.outEdges[fromRootContextId].set(toRootContextId, edgeType);
    this.inEdges[toRootContextId].set(fromRootContextId, edgeType);

    asyncEventCollection.addEdge(fromRootContextId, toRootContextId, edgeType);
  }

  /**
   * Get last run of the thread, by `threadLastRun` map
   * @param {number} threadId 
   * @return {number} The last run id of the thread
   */
  getLastRootContextOfThread(threadId) {
    // this.logger.debug("get last run of thread", threadId, "returns", this.threadLastRun.get(threadId));
    return this.threadLastRootContext.get(threadId);
  }

  // ###########################################################################
  // promises
  // ###########################################################################

  setupPromise(promise, threadId, edgeType, chainedToRoot = undefined) {
    setPromiseData(promise, {
      value: {
        threadId,
        edgeType,
        chainedToRoot
      },
      writable: true,
      enumerable: false,
      configurable: false
    });
  }

  getPromiseEdgeType(promise) {
    const threadId = getOwnPromiseEdgeType(promise);
    if (threadId) {
      return threadId;
    }

    const callerPromise = this.getAsyncCallerPromise(promise);
    if (callerPromise) {
      return this.getPromiseEdgeType(callerPromise);
    }

    return 0;
  }

  getPromiseChainedToRoot(promise) {
    const chainedToRoot = getOwnPromiseChainedToRoot(promise);
    if (chainedToRoot !== undefined) {
      return chainedToRoot;
    }

    const callerPromise = this.getAsyncCallerPromise(promise);
    if (callerPromise) {
      return this.getPromiseChainedToRoot(callerPromise);
    }

    return false;
  }

  /**
   * 
   */
  getPromiseThreadId(promise) {
    // this.logger.debug('get promise thread id', { promise });
    const threadId = getOwnPromiseThreadId(promise);
    if (threadId) {
      return threadId;
    }

    const callerPromise = this.getAsyncCallerPromise(promise);
    // this.logger.debug('caller promise', callerPromise);
    if (callerPromise) {
      return this.getPromiseThreadId(callerPromise);
    }

    return 0;
  }

  storeFirstAwaitPromise(runId, contextId, awaitArgument) {
    // this.logger.debug('store first await promise', runId, contextId, awaitArgument);
    const pair = { runId, contextId };
    this.promiseContextMap.set(awaitArgument, pair);
    this.contextPromiseMap.set(pair, awaitArgument);
    // TOD: seems like useless
  }

  // TODO: move to `dataUtil.js`
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

    if (getPromiseRunId(callerPromise) === getPromiseRunId(promise)) {
      return callerPromise;
    }

    throw new Error('Something shouldn\'t happen: we are only looking this up in case of a first await');
  }

  getAsyncPromiseCallerTrace(promise) {
    return traceCollection.getById(this.runContextTraceCallPromiseMap.get(promise).traceId);
  }

  isPromiseCreatedInRun(promise, runId = this.getCurrentRunId()) {
    return getPromiseRunId(promise) === runId;
  }

  isPromiseRecorded(promise) {
    return !!getPromiseRunId(promise);
  }

  isRootContext(contextId) {
    return !executionContextCollection.getById(contextId).parentContextId;
  }

  runContextTraceCallPromiseMap = new Map();
  promiseRunContextTraceMap = new Map();
  storeAsyncCallPromise(runId, contextId, traceId, promise) {
    setPromiseData({ runId });
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

  registerAwait(parentContext, awaitArgument) {
    if (this._firstAwaitPromise.get(parentContext) === undefined) {
      this._firstAwaitPromise.set(parentContext, awaitArgument);
    }
  }
}



// export class ExecutingStack {
//   stack = [];

//   constructor(stack = []) {
//     this.stack = [...stack];
//   }

//   /**
//    * Get the length of the executing stack.
//    */
//   length() {
//     return this.stack.length;
//   }

//   /**
//    * Push a context into executing stack.
//    * @param {number} x Context id
//    */
//   push(x) {
//     this.stack.push(x);
//   }

//   /**
//    * Pop context `x` from executing stack.
//    * Returns abandoned executing stack if `x` is not `top(1)`, `null` otherwise.
//    * @param {number} x Context id
//    * @return {ExecutingStack?}
//    */
//   pop(x) {
//     if (this.stack[this.stack.length - 1] === x) {
//       this.stack.pop();
//       return null;
//     } else {
//       const index = this.stack.indexOf(x);
//       if (index === -1) {
//         // warn(`Trying to pop ${x} but not in execting stack: ${this.stack}, ignoring.`);
//         return null;
//       } else {
//         const abandonedStack = this.stack.splice(index);
//         this.stack.pop();

//         return new ExecutingStack(abandonedStack);
//       }
//     }
//   }

//   /**
//    * @param {number} z 
//    * @returns {number} The top `z` excuting stack context 
//    */
//   top(z = 1) {
//     return this.stack[this.stack.length - z];
//   }
// }

// export class RuntimeThreadsStack {
//   /**
//    * @type {ExecutingStack} The current executing stack, filling with context id
//    */
//   currentStack = new ExecutingStack();

//   /**
//    * @type {Map<number, ExecutingStack>}
//    */
//   waitingStack = new Map();

//   /**
//    * Add a context id into the current stack
//    * @param {number} contextId 
//    */
//   push(contextId) {
//     this.currentStack.push(contextId);
//   }  

//   /**
//    * Pop a context id from current stack
//    * @param {number} contextId 
//    */
//   pop(contextId) {
//     const abandonedStack = this.currentStack.pop(contextId);

//     if (abandonedStack) {
//       this.addWaitingStack(abandonedStack);
//     }
//   }

//   /**
//    * Add a stack into waiting stack.
//    * @param {ExecutingStack} stack 
//    */
//   addWaitingStack(stack) {
//     const lastContext = stack.top(1);
//     this.waitingStack.set(lastContext, stack);
//   }

//   /**
//    * Resume a stack with specific last context id back to executing stack
//    * @param {number} x contextId
//    */
//   resumeWaitingStack(x) {
//     const stack = this.waitingStack.get(x);
//     if (!stack) {
//       warn(`trying to resume a waiting stack with top = ${x} but not found.`);
//     } else {
//       if (this.currentStack.length !== 0) {
//         warn(`trying to resume a waiting stack while there is still a stack with contexts executing. Put into waiting stack.`);
//         this.addWaitingStack(this.currentStack);
//       }

//       this.currentStack = stack;
//       this.waitingStack.delete(x);
//     }
//   }
// }