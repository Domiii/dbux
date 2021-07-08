import { newLogger } from '@dbux/common/src/log/logger';
import isPromise from '@dbux/common/src/util/isPromise';
import asyncEventCollection from './data/asyncEventCollection';
import executionContextCollection from './data/executionContextCollection';
import runCollection from './data/asyncNodeCollection';
import traceCollection from './data/traceCollection';
import valueCollection from './data/valueCollection';
import { isFirstContextInParent } from './data/dataUtil';

/** @typedef { import("./Runtime").default } Runtime */

export class RuntimeThreads1 {
  logger = newLogger('Threads');

  /**
   * @type {number} Maintain thread count
   */
  _maxThreadId = 1;

  floatingPromises = [];

  outEdges = [];
  inEdges = [];
  /**
   * Stores key = realContextId, value = { resumeContextId, rootId } for
   * connecting `preAwait` and `postAwait` events.
   */
  lastAwaitByRealContext = new Map();

  runToThreadMap = new Map();
  threadFirstRun = new Map();
  lastRootContextByThread = new Map([[1, 1]]);

  /**
   * Used to get the firstAwait promise by called context after CallExpression.
   */
  firstAwaitPromiseByContext = new Map();
  promiseRunContextTraceMap = new Map();

  /**
   * @type {Runtime}
   */
  _runtime;

  constructor(runtime) {
    this._runtime = runtime;
  }

  // getCurrentRunId() {
  //   return this._runtime.getCurrentRunId();
  // }
  getCurrentVirtualRootId() {
    return this._runtime.getCurrentVirtualRootId();
  }

  // ###########################################################################
  // preAwait
  // ###########################################################################

  /**
   * Track any created promise (that is the return value of a function or ctor call).
   */
  traceCallPromiseResult(contextId, calledContextId, trace, promise) {
    const currentRootId = this.getCurrentVirtualRootId();
    if (!this.isNewPromise(promise, currentRootId)) {
      // this.logger.warn('promise not created in this run', promiseRunId, promise);
      return;
    }

    // register previously unseen promise
    this.recordFloatingPromise(promise, currentRootId);

    const calledFirstAwaitPromise = this.getContextFirstAwaitPromise(calledContextId);
    if (calledFirstAwaitPromise) {
      // TODO: this is not necessarily an "async call promise"
      this.storeAsyncCallPromise(currentRootId, calledContextId, trace.traceId, calledFirstAwaitPromise);
    }

    // this.recordContextReturnValue(calledContextId, promise);
  }

  preAwait(awaitArgument, resumeContextId, parentContextId) {
    const currentRootId = this.getCurrentVirtualRootId();
    // this.logger.debug('pre await', awaitArgument);

    // this.floatingPromises.delete(awaitArgument);
    // this.logger.debug('delete floating promise', awaitArgument);


    // TODO: also log promise itself
    // TODO: add an outward edge, if pointing to a promise that already has a threadId?
    // TODO: in postAwait, add an inward edge from the `lastRootContextId` of the promise

    this.lastAwaitByRealContext.set(parentContextId, { resumeContextId, rootId: currentRootId });

    if (!isPromise(awaitArgument)) {
      return;
    }
    // if (!this.isNewPromise(awaitArgument, currentRootId)) {
    //   return;
    // }

    const isFirstAwait = isFirstContextInParent(resumeContextId, parentContextId);

    if (isFirstAwait) {
      this.firstAwaitPromiseByContext.set(parentContextId, awaitArgument);
    }

    // this.logger.debug('this promise', promise, 'first await', isFirstAwait, 'is root', this.isRootContext(parentContextId));
    if (!isFirstAwait || this.isRootContext(parentContextId)) {
      const threadId = this.getRootContextThreadId(currentRootId);
      this.setupPromise(awaitArgument, currentRootId, threadId, true);
    }
  }

  recordFloatingPromise(promise, currentRootId) {
    setPromiseData(promise, setPromiseData(promise, { rootId: currentRootId }));
    this.floatingPromises.push(promise);
  }


  // ###########################################################################
  // postAwait
  // ###########################################################################

  postAwait(realContextId, postEventContext, awaitArgument) {
    const {
      resumeContextId: preEventContextId,
      rootId: preEventRootId
    } = this.lastAwaitByRealContext.get(realContextId);
    const postEventRootId = this.getCurrentVirtualRootId();

    this.logger.debug(`postAwait ${preEventRootId}->${postEventRootId}`);

    const startThreadId = this.getRootContextThreadId(preEventRootId);

    let edgeType = ''; // TODO change to enum

    if (this.getLastRootContextOfThread(startThreadId) === postEventRootId) {
      this.logger.warn(
        // eslint-disable-next-line max-len
        `[postAwait] tried to handle postEventRootId more than once for thread`, startThreadId, `.getLastRootContextOfThread(startThreadId) === postEventRootId. Type=${edgeType}, ` +
      `runs=${this.debugGetAllRunsOfThread(startThreadId)} (Skipped).`
      );
    }
    else {
      let fromRootId;
      const isNested = isPromise(awaitArgument);
      let fromThreadId;
      if (isNested) {
        // nested await argument
        // NOTE: `threadId` might be null
        fromThreadId = this.getPromiseThreadId(awaitArgument);
        fromRootId = this.getLastRootContextOfThread(fromThreadId);
        edgeType = fromThreadId && 'CHAIN';
      }
      else {
        // chain depends on caller semantics
        fromRootId = preEventRun;

        // // assign run <-> threadId
        // NOTE: this should probably not happen
        // let fromRootIdThreadId = getRunThreadId(fromRootId);
        // if (!fromRootIdThreadId) {
        //   // this.logger.debug("From run", fromRootId, "is a new run, assign thread id");
        //   fromRootIdThreadId = this.assignRunNewThreadId(fromRootId);
        // }

        if (isFirstContextInParent(preEventContextId)) {
          // -> not nested, first await
          //      -> this makes it the "inner-most" "first await"
          const callerContextId = executionContextCollection.getById(preEventContextId).contextId;
          const callerPromise = this.getAsyncCallerPromise(callerContextId); // get return value

          // look up root threadId + edgeType
          // NOTE: `threadId` might be null
          fromThreadId = this.getPromiseThreadId(callerPromise);
          edgeType = this.getPromiseEdgeType(callerPromise);
        }
        else {
          fromThreadId = getRunThreadId(preEventRun);
          edgeType = 'CHAIN';
        }
      }

      // add edge
      this.logger.debug(`[${edgeType === 'FORK' ? `${startThreadId}->` : ''}${fromThreadId}] ${edgeType} - Runs: ${fromRootId}->${postEventRun} (${isNested ? `nested` : ''})`);
      this.addEdge(fromRootId, postEventRun, fromThreadId, edgeType);
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
      } else {
        // floating promise is not bound to root context, and has no further caller
        this.setupPromise(promise, rootId, 0, false);
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
  postRootContext(rootContextId) {
    const threadId = getRunThreadId(runId);

    runCollection.addRun(runId, threadId);
  }

  /**
   * Maintain `runToThreadMap` map and `threadId`'s last run in `threadLastRun` map
   * @param {number} runId 
   * @param {number} threadId 
   */
  setRunThreadId(runId, threadId) {
    const threadLastRun = Math.max(runId, this.lastRootContextByThread.get(threadId) || 0);
    // this.logger.debug(`[${threadId}] set runId=${runId}, threadLastRun=${threadLastRun}`);

    this.runToThreadMap.set(runId, threadId);
    this.lastRootContextByThread.set(threadId, threadLastRun);
  }

  /**
   * Get thread id of the given run id
   * @param {number} runId 
   */
  getRootContextThreadId(rootContextId) {
    if (rootContextId === 1) {
      return 1;
    }

    // TODO
    return this.runToThreadMap.get(runId);
  }

  hasChainsFrom(fromRootId) {
    return !!this.outEdges[fromRootId];
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
   * Make an edge between `fromRootId` and `toRootId`, with type `edgeType`
   * @param {number} fromRootId 
   * @param {number} toRootId 
   * @param {string} edgeType should be either 'CHAIN' or 'FORK'
   */
  addEdge(fromRootId, toRootId, fromThreadId, edgeType) {
    const coerceToFork = !fromThreadId ||
      // this root already has an out-going chain
      // NOTE: this can happen if multiple promises where then-chained to the same promise.
      edgeType === 'CHAIN' && this.hasChainsFrom(fromRootId) !== null;

    if (coerceToFork) {
      edgeType = 'FORK';
      fromThreadId = this.newThreadId();

      // warn("Trying to add CHAIN to an run already had outgoing CHAIN edge");
    }


    if (!getRunThreadId(postEventRun)) {
      this.setRunThreadId(postEventRun, threadId);
    }


    if (!this.outEdges[fromRootId]) {
      this.outEdges[fromRootId] = new Map();
    }
    if (!this.inEdges[toRootId]) {
      this.inEdges[toRootId] = new Map();
    }

    this.outEdges[fromRootId].set(toRootId, edgeType);
    this.inEdges[toRootId].set(fromRootId, edgeType);

    asyncEventCollection.addEdge(fromRootId, toRootId, edgeType);
  }

  /**
   * Get last run of the thread, by `threadLastRun` map
   * @param {number} threadId 
   * @return {number} The last run id of the thread
   */
  getLastRootContextOfThread(threadId) {
    // this.logger.debug("get last run of thread", threadId, "returns", this.threadLastRun.get(threadId));
    return this.lastRootContextByThread.get(threadId);
  }

  // ###########################################################################
  // promises
  // ###########################################################################

  setupPromise(promise, rootId, threadId, chainedToRoot = undefined) {
    setPromiseData(promise, {
      value: {
        rootId,
        threadId,
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

  // getTraceValue(trace) {
  //   if (trace.value) {
  //     return trace.value;
  //   }

  //   if (trace.valueId) {
  //     return valueCollection.getById(trace.valueId).value;
  //   }

  //   return undefined;
  // }

  getAsyncCallerPromise(promise) {
    // TODO: fix this
    const callerTrace = getAsyncPromiseCallerTrace(promise);
    const callerPromise = getTraceValue(callerTrace);

    if (getPromiseRunId(callerPromise) === getPromiseRunId(promise)) {
      return callerPromise;
    }

    throw new Error('Something shouldn\'t happen: we are only looking this up in case of a first await');
  }

  isNewPromise(promise, currentRootId) {
    const promiseCurrentRootId = getPromiseRootId(promise);
    return !promiseCurrentRootId || promiseCurrentRootId === currentRootId;
  }

  isRootContext(contextId) {
    return !executionContextCollection.getById(contextId).parentContextId;
  }

  storeAsyncCallPromise(runId, contextId, traceId, promise) {
    setPromiseData({ runId });
    const key = { runId, contextId, traceId };
    this.runContextCallTracePromiseMap.set(key, promise);
    this.promiseRunContextTraceMap.set(promise, key);
  }

  getContextFirstAwaitPromise(contextId) {
    return this.firstAwaitPromiseByContext.get(contextId);
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


function setPromiseData(promise, data) {
  let { _dbux_ } = promise;
  if (!_dbux_) {
    Object.defineProperty(promise, '_dbux_', {
      value: _dbux_ = {},
      writable: true,
      enumerable: false,
      configurable: false
    });
  }
  Object.assign(_dbux_, data);
}


function getPromiseRootId(promise) {
  return promise._dbux_?.rootId;
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


// // TODO: fix this entire class
// export class RuntimeThreads2 {
//   logger = newLogger('RuntimeThread2');

//   promiseSet = new WeakSet();
//   promiseAwaitedSet = new WeakSet();

//   promiseCreatedInThisRunSet = new WeakSet();
//   promiseAwaitedInThisRunSet = new WeakSet();
//   promiseExecutionContextMap = new WeakMap();

//   recordMaybeNewPromise(promise, createAtRunId, createAtContext, contextIdInsidePromise) {
//     if (this.promiseSet.has(promise)) {
//       return;
//     }

//     this.promiseSet.add(promise);
//     this.promiseCreatedInThisRunSet.add(promise);
//     this.promiseExecutionContextMap.set(promise, { createAtContext, contextIdInsidePromise });
//   }

//   promiseAwaited(promise, awaitAtRunId) {
//     if (this.promiseAwaitedSet.has(promise)) {
//       // This promise is awaited previously
//       return;
//     }

//     this.promiseAwaitedSet.add(promise);
//     this.promiseAwaitedInThisRunSet.add(promise);
//   }

//   postRun() {
//     // for (const promise of this.promiseCreatedInThisRunSet) {
//     //   const { createAtContext, contextIdInsidePromise } = this.promiseExecutionContextMap.get(promise);
//     //   if (this.promiseAwaitedInThisRunSet.has(promise)) {
//     //     this.logger.debug(`context ${createAtContext} -> ${contextIdInsidePromise} not fork`);
//     //     // not a fork
//     //   } else {
//     //     this.logger.debug(`context ${createAtContext} -> ${contextIdInsidePromise} fork`);
//     //     // fork to different thread
//     //   }
//     // }

//     this.promiseCreatedInThisRunSet.clear();
//     this.promiseAwaitedInThisRunSet.clear();
//   }
// }
