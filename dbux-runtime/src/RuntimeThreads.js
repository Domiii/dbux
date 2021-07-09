import { newLogger } from '@dbux/common/src/log/logger';
import isPromise from '@dbux/common/src/util/isPromise';
import asyncEventCollection from './data/asyncEventCollection';
import executionContextCollection from './data/executionContextCollection';
import asyncNodeCollection from './data/asyncNodeCollection';
import traceCollection from './data/traceCollection';
import valueCollection from './data/valueCollection';
import { isFirstContextInParent, isRootContext } from './data/dataUtil';
import { some } from 'lodash';

/** @typedef { import("./Runtime").default } Runtime */

export class RuntimeThreads1 {
  logger = newLogger('Threads');

  /**
   * @type {number} Maintain thread count
   */
  _maxThreadId = 1;

  floatingPromises = [];

  /**
   * @type {Array.<Map.<number, number>>}
   */
  outEdges = [];
  /**
   * @type {Array.<Map.<number, number>>}
   */
  inEdges = [];
  /**
   * Stores key = realContextId, value = { resumeContextId, rootId } for
   * connecting `preAwait` and `postAwait` events.
   */
  lastAwaitByRealContext = new Map();

  /**
   * TODO: move to `AsyncNodeCollection`
   */
  threadsByRoot = new Map();
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
    if (!isNewPromise(promise)) {
      // this.logger.warn('have seen promise before', currentRootId, promise._dbux_);
      return;
    }

    // register previously unseen promise
    this.recordFloatingPromise(promise, currentRootId);

    const lastAwaitData = this.lastAwaitByRealContext.get(calledContextId);
    if (lastAwaitData?.isFirstAwait) { // NOTE: in this case, `isFirstAwait` should always be true, if exists
      // -> the first time this promise has been seen, and it is the return value of `calledContextId`
      // -> this should be the caller of `calledContextId`

      // TODO: establish async caller chain
    }
    // if (calledFirstAwaitPromise) {
    //   // const key = { runId, contextId, traceId };
    //   // this.runContextCallTracePromiseMap.set(key, promise);
    //   // this.promiseRunContextTraceMap.set(promise, key);
    // }
  }

  preAwait(awaitArgument, resumeContextId, parentContextId) {
    const currentRootId = this.getCurrentVirtualRootId();
    // this.logger.debug('pre await', awaitArgument);

    // this.floatingPromises.delete(awaitArgument);
    // this.logger.debug('delete floating promise', awaitArgument);


    // TODO: add edge
    //    * if nested and promise already has `lastAsyncNode`
    //      -> add an edge from `preEvent` `AsyncNode` to promise's `lastAsyncNode`
    // const isFirstAwait = isFirstContextInParent(resumeContextId);

    this.lastAwaitByRealContext.set(parentContextId, {
      resumeContextId,
      rootId: currentRootId,
      isFirstAwait,
      // awaitArgument
    });

    if (!isPromise(awaitArgument)) {
      return;
    }

    // this.logger.debug('this promise', promise, 'first await', isFirstAwait, 'is root', this.isRootContext(parentContextId));
    // if (!isFirstAwait || isRootContext(parentContextId)) {
    //   const threadId = this.getRootThreadId(currentRootId);
    //   this.setupPromise(awaitArgument, currentRootId, threadId, true);
    // }
  }

  recordFloatingPromise(promise, currentRootId) {
    setPromiseData(promise, setPromiseData(promise, { rootId: currentRootId }));
    this.floatingPromises.push(promise);
  }


  // ###########################################################################
  // postAwait
  // ###########################################################################

  postAwait(awaitContextId, realContextId, postEventContextId, awaitArgument) {
    const {
      resumeContextId: preEventContextId,
      rootId: preEventRootId
    } = this.lastAwaitByRealContext.get(realContextId);

    const postEventRootId = this.getCurrentVirtualRootId();
    const preEventThreadId = this.getRootThreadId(preEventRootId);
    
    let fromRootId;
    let fromThreadId, toThreadId;

    this.logger.debug(`postAwait ${preEventRootId}->${postEventRootId}`);

    // TODO:
    //
    // if is not first await:
    //    * postEvent threadId = preEvent threadId
    // else:
    //    * 
    //
    // if has nested promise:
    //    * if promise has `lastRootContextId` that is different from `postEventRootId`:
    //      -> add an edge from the `lastRootContextId` of the promise to `postEventRootId`

    // if is inner-most first await:
    //    -> add an edge from all "callerPromises" to postEvent `AsyncNode`

    // TODO: what other cases are there? Do we need to add prevention checks against duplicate threads?

    const isFirstAwait = isFirstContextInParent(preEventContextId);
    if (isFirstAwait) {
      // -> first await -> determine `fromThreadId` from caller
      const callerContextId = executionContextCollection.getById(preEventContextId).contextId;
      const callerPromise = this.getAsyncCallerPromise(callerContextId); // get return value

      if (this.getAsyncCallerPromiseChainedToRoot(callerPromise)) {
        // caller chained to root -> CHAIN
        fromThreadId = ;
      }
      else {
        // caller chained to root -> FORK

      }
    }
    else {
      // not first await, and not nested -> simply connect preEvent -> postEvent
      fromThreadId = preEventThreadId;
    }

    const isNested = isPromise(awaitArgument);
    if (isNested) {
      // nested promise
      fromThreadId = getOwnPromiseThreadId(awaitArgument);
      fromRootId = this.getLastRootContextOfThread(fromThreadId);
      toThreadId = preEventThreadId;
    }
    else {
      // not nested
      fromRootId = preEventRootId;

      // // assign run <-> threadId
      // NOTE: this should probably not happen
      // let fromRootIdThreadId = getRunThreadId(fromRootId);
      // if (!fromRootIdThreadId) {
      //   // this.logger.debug("From run", fromRootId, "is a new run, assign thread id");
      //   fromRootIdThreadId = this.assignRunNewThreadId(fromRootId);
      // }
    }

    if (this.getLastRootContextOfThread(fromThreadId) === postEventRootId) {
      this.logger.warn(
        // eslint-disable-next-line max-len
        `[postAwait] tried to handle postEventRootId more than once for thread ${preEventThreadId}` +
        `getLastRootContextOfThread(startThreadId) === postEventRootId. ` +
        `Runs=${this.debugGetAllRunsOfThread(preEventThreadId)} (Skipped).`
      );
    }

    // add edge
    this.logger.debug(`[${fromThreadId !== toThreadId ? `${preEventThreadId}->` : ''}${toThreadId}] Roots: ${fromRootId}->${postEventRootId} (${isNested ? `nested` : ''})`);
    this.addEdge(fromRootId, postEventRootId, fromThreadId, toThreadId);
  }

  /**
   * This is called `postRun` to process promises that are return values of `async` functions.
   */
  processFloatingPromises() {
    // // this.logger.debug('clean flating promise');
    // const maintainPromiseThreadIdDfs = promise => {
    //   // this.logger.debug('do promise', promise);

    //   console.warn(`floatingPromise`, promise, this.getAsyncCallerPromise(promise));

    //   if (getOwnPromiseThreadId(promise)) {
    //     // this.logger.debug('get own thread id', getOwnPromiseThreadId(promise));
    //     return getOwnPromiseThreadId(promise);
    //   }
    //   const callerPromise = this.getAsyncCallerPromise(promise);

    //   if (callerPromise) {
    //     // this promise participates in an await chain. Does not have "own" threadId.
    //     maintainPromiseThreadIdDfs(callerPromise);
    //   } else {
    //     // floating promise is not bound to root context, and has no further caller
    //     this.setupPromise(promise, rootId, 0, false);
    //   }
    //   // this.logger.debug('promise become', promise);
    //   return getOwnPromiseThreadId(promise);
    // };
    // for (let promise of this.floatingPromises) {
    //   maintainPromiseThreadIdDfs(promise);
    // }
    // this.floatingPromises = [];
    // // this.logger.debug("end clean");
  }


  // ###########################################################################
  // runs
  // ###########################################################################

  /**
   * Used for debugging purposes.
   */
  debugGetAllRunsOfThread(threadId) {
    return Array.from(this.threadsByRoot.entries())
      .filter(([, t]) => t === threadId)
      .map(([r]) => r);
  }

  /**
   * Called when a run is finished.
   * @param {number} runId 
   */
  postRun(/* rootContextIds */) {
    // TODO: process rootContextIds
    this.processFloatingPromises();
  }

  /**
   * Maintain `runToThreadMap` map and `threadId`'s last run in `threadLastRun` map
   * @param {number} runId 
   * @param {number} threadId 
   */
  setRootThreadId(rootId, threadId) {
    // const threadLastRun = Math.max(runId, this.lastRootContextByThread.get(threadId) || 0);
    // this.logger.debug(`[${threadId}] set runId=${runId}, threadLastRun=${threadLastRun}`);

    this.threadsByRoot.set(rootId, threadId);

    asyncNodeCollection.addAsyncNode(rootId, threadId);
    // this.lastRootContextByThread.set(threadId, threadLastRun);
  }

  /**
   * 
   */
  getRootThreadId(rootId) {
    if (rootId === 1) {
      return 1;
    }

    return this.threadsByRoot.get(rootId);
  }

  hasEdgesFrom(fromRootId) {
    return !!this.outEdges[fromRootId];
  }

  hasChainFrom(fromRootId) {
    const edges = this.outEdges[fromRootId];
    const fromThreadId = this.getRootThreadId(fromRootId);
    return edges && some(edges.values(), (toRootId) => fromThreadId === this.getRootThreadId(toRootId)) || false;
  }

  hasEdgeFromTo(fromRootId, toRootId) {
    return !!this.outEdges[fromRootId]?.get(toRootId);
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
   * Add an edge between `fromRootId` and `toRootId`
   * @param {number} fromRootId 
   * @param {number} toRootId 
   */
  addEdge(fromRootId, toRootId, fromThreadId, toThreadId) {
    const previousFromThreadId = asyncNodeCollection.getById(fromRootId)?.threadId;
    const previousToThreadId = asyncNodeCollection.getById(toRootId)?.threadId;

    if (!previousFromThreadId) {
      this.logger.warn(`Tried to add edge from root ${fromRootId} but it did not have a threadId`);
      return;
    }
    if (this.hasEdgeFromTo(fromRootId, toRootId)) {
      this.logger.warn(`Tried to add edge twice from ${fromRootId} (t=${previousFromThreadId}->${fromThreadId}) to ${toRootId} (t=${previousToThreadId}->${toThreadId})`);
      return;
    }

    // `setRootThreadId`
    const isFork = !toThreadId ||
      // this root already has an out-going chain
      // NOTE: this can happen, e.g. when multiple promises where then-chained to the same promise.
      (fromThreadId === toThreadId && this.hasChainFrom(fromRootId));
    if (isFork) {
      toThreadId = this.newThreadId();

      // warn("Trying to add CHAIN to an run already had outgoing CHAIN edge");
    }
    this.setRootThreadId(toRootId, toThreadId);


    // add edge
    if (!this.outEdges[fromRootId]) {
      this.outEdges[fromRootId] = new Map();
    }
    if (!this.inEdges[toRootId]) {
      this.inEdges[toRootId] = new Map();
    }
    this.outEdges[fromRootId].set(toRootId, 1);
    this.inEdges[toRootId].set(fromRootId, 1);

    asyncEventCollection.addEdge(fromRootId, toRootId);
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

  // getAsyncCallerPromiseEdgeType(promise) {
  //   const threadId = getOwnPromiseEdgeType(promise);
  //   if (threadId) {
  //     return threadId;
  //   }

  //   const callerPromise = this.getAsyncCallerPromise(promise);
  //   if (callerPromise) {
  //     return this.getAsyncCallerPromiseEdgeType(callerPromise);
  //   }

  //   return 0;
  // }

  getAsyncCallerPromiseChainedToRoot(promise) {
    const chainedToRoot = getOwnPromiseChainedToRoot(promise);
    if (chainedToRoot !== undefined) {
      return chainedToRoot;
    }

    const callerPromise = this.getAsyncCallerPromise(promise);
    if (callerPromise) {
      return this.getAsyncCallerPromiseChainedToRoot(callerPromise);
    }

    return false;
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

  // TODO: fix this/get rid of it
  getAsyncCallerPromise(promise) {
    const callerTrace = getAsyncPromiseCallerTrace(promise);
    const callerPromise = getTraceValue(callerTrace);

    if (getPromiseRunId(callerPromise) === getPromiseRunId(promise)) {
      return callerPromise;
    }

    throw new Error('Something shouldn\'t happen: we are only looking this up in case of a first await');
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

function isNewPromise(promise) {
  return !getPromiseRootId(promise);
}

function isPromiseOfRoot(promise, rootId) {
  const promiseRootId = getPromiseRootId(promise);
  return promiseRootId === rootId;
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
