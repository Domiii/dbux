import { newLogger } from '@dbux/common/src/log/logger';
import isPromise from '@dbux/common/src/util/isPromise';
import asyncEventCollection from './data/asyncEventCollection';
import executionContextCollection from './data/executionContextCollection';
import asyncNodeCollection from './data/asyncNodeCollection';
import traceCollection from './data/traceCollection';
import valueCollection from './data/valueCollection';
import { isFirstContextInParent, isRootContext } from './data/dataUtil';
import { some } from 'lodash';
import EmptyObject from '@dbux/common/src/util/EmptyObject';

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

    const lastAwaitData = this.lastAwaitByRealContext.get(calledContextId);
    if (lastAwaitData?.isFirstAwait) { // NOTE: in this case, `isFirstAwait` should always be true, if exists
      // -> the first time this promise has been seen, and it is the return value of `calledContextId`
      // -> this should be the caller of `calledContextId`

      // TODO: establish async caller chain
      lastAwaitData.returnPromise = promise;
    }

    // register previously unseen promise
    this.recordFloatingPromise(promise, currentRootId, lastAwaitData && calledContextId);

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
    const isFirstAwait = isFirstContextInParent(resumeContextId);

    this.lastAwaitByRealContext.set(parentContextId, {
      resumeContextId,
      rootId: currentRootId,
      isFirstAwait,
      // awaitArgument
    });

    if (!isPromise(awaitArgument)) {
      return;
    }

    const asyncFunctionContextId = getPromiseOwnAsyncFunctionContextId(awaitArgument);
    const nestedAsyncData = asyncFunctionContextId && this.lastAwaitByRealContext.get(asyncFunctionContextId);
    if (asyncFunctionContextId && !nestedAsyncData) {
      this.logger.warn(`nestedAsyncData not found for parentContextId=${parentContextId}, asyncFunctionContextId=${asyncFunctionContextId}`);
      return;
    }

    nestedAsyncData.firstAwaitingAsyncFunctionContextId = parentContextId;

    // this.logger.debug('this promise', promise, 'first await', isFirstAwait, 'is root', this.isRootContext(parentContextId));
    // if (!isFirstAwait || isRootContext(parentContextId)) {
    //   const threadId = this.getRootThreadId(currentRootId);
    //   this.setupPromise(awaitArgument, currentRootId, threadId, true);
    // }
  }

  recordFloatingPromise(promise, currentRootId, asyncFunctionContextId) {
    setPromiseData(promise, { 
      rootId: currentRootId,
      lastRootId: currentRootId,
      asyncFunctionContextId
    });
    this.floatingPromises.push(promise);
  }


  // ###########################################################################
  // postAwait
  // ###########################################################################

  postAwait(awaitContextId, realContextId, postEventContextId, awaitArgument) {
    const {
      resumeContextId: preEventContextId,
      rootId: preEventRootId,
      returnPromise
    } = this.lastAwaitByRealContext.get(realContextId);

    const postEventRootId = this.getCurrentVirtualRootId();
    const preEventThreadId = this.getRootThreadId(preEventRootId);

    let fromRootId;
    let fromThreadId;
    let toThreadId;

    const isFirstAwait = isFirstContextInParent(preEventContextId);
    if (!isFirstAwait) {
      // not first await, and not nested -> CHAIN
      toThreadId = preEventThreadId;
    }
    else if (this.isAsyncFunctionChainedToRoot(realContextId)) {
      // first await, but caller chained to root -> CHAIN
      toThreadId = preEventThreadId;
    }
    else {
      // first await, but caller not chained to root -> FORK
      toThreadId = 0;
    }

    const isNested = isPromise(awaitArgument);
    if (isNested) {
      // nested promise:
      //  -> an out-going edge has already been added from `preEventRootId` to the beginning of that promise
      //  -> we now reel it back in
      ({
        lastRootId: fromRootId,
        threadId: fromThreadId
      } = getPromiseData(awaitArgument));
    }
    else {
      // not nested
      fromRootId = preEventRootId;
      fromThreadId = preEventThreadId;

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
    // eslint-disable-next-line max-len
    this.logger.debug(`postAwait [${fromThreadId !== toThreadId ? `${preEventThreadId}->` : ''}${toThreadId}] Roots: ${fromRootId}->${postEventRootId} (${isNested ? `nested` : ''})`);

    const actualToThreadId = this.addEdge(fromRootId, postEventRootId, fromThreadId, toThreadId);

    // store `actualToThreadId` and `postEventRootId` with `returnPromise`
    setPromiseData(returnPromise, {
      threadId: actualToThreadId,
      lastRootId: postEventRootId
    });
  }

  /**
   * This is called `postRun` to process promises that are return values of `async` functions.
   */
  processFloatingPromises() {
    // // this.logger.debug('clean flating promise');
    // const maintainPromiseThreadIdDfs = promise => {
    //   // this.logger.debug('do promise', promise);

    //   console.warn(`floatingPromise`, promise, this.getAsyncCallerPromise(promise));

    //   if (getPromiseOwnThreadId(promise)) {
    //     // this.logger.debug('get own thread id', getPromiseOwnThreadId(promise));
    //     return getPromiseOwnThreadId(promise);
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
    //   return getPromiseOwnThreadId(promise);
    // };
    // for (let promise of this.floatingPromises) {
    //   maintainPromiseThreadIdDfs(promise);
    // }
    // this.floatingPromises = [];
    // // this.logger.debug("end clean");
  }


  // ###########################################################################
  // bookkeeping utilities
  // ###########################################################################

  /**
   * Traverse nested awaits, to find out, if outer-most await is in root.
   * @return {boolean}
   */
  isAsyncFunctionChainedToRoot(realContextId) {
    // NOTE: asyncData should always exist, since we are calling this `postAwait`
    const asyncData = this.lastAwaitByRealContext.get(realContextId);

    const {
      // asyncFunctionContextId,
      // threadId,
      // returnPromise,
      firstAwaitingAsyncFunctionContextId
    } = asyncData;

    // NOTE: `this.getAsyncFunctionChainedToRoot` uses firstAwaitingAsyncFunctionContextId
    //    -> what if await, but its not first?
    //    -> TODO: add synchronization links (out and back in)

    if (!firstAwaitingAsyncFunctionContextId) {
      return isRootContext(realContextId);
    }
    else {
      // keep going up
      return this.isAsyncFunctionChainedToRoot(firstAwaitingAsyncFunctionContextId);
    }

    // const parentContextId = getPromiseOwnAsyncFunctionContextId(returnPromise);


    // const chainedToRoot = getPromiseOwnChainedToRoot(promise);
    // if (chainedToRoot !== undefined) {
    //   return chainedToRoot;
    // }

    // const callerPromise = this.getAsyncCallerPromise(promise);
    // if (callerPromise) {
    //   return this.getAsyncCallerPromiseChainedToRoot(callerPromise);
    // }

    // return false;
  }

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
  postRun(runId, /* rootContextIds */) {
    // TODO: process rootContextIds
    // if (runId === 1) {
    //   this.setRootThreadId(rootContextId, newThreadId());
    // }
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
    // eslint-disable-next-line no-console
    console.trace('newThreadId', this._maxThreadId);
    return this._maxThreadId;
  }

  /**
   * Add an edge between `fromRootId` and `toRootId`
   * @param {number} fromRootId 
   * @param {number} toRootId 
   */
  addEdge(fromRootId, toRootId, fromThreadId, toThreadId) {
    // TODO: fix this -> asyncNodeCollection.getById does not take rootId
    // TODO: what to do with `fromThreadId` and `toThreadId`?
    // const previousFromThreadId = asyncNodeCollection.getById(fromRootId)?.threadId;
    // const previousToThreadId = asyncNodeCollection.getById(toRootId)?.threadId;

    if (!previousFromThreadId) {
      this.logger.warn(`Tried to add edge from root ${fromRootId} but it did not have a threadId`);
      return 0;
    }
    if (this.hasEdgeFromTo(fromRootId, toRootId)) {
      this.logger.warn(`Tried to add edge twice from ${fromRootId} (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => ${toThreadId})`);
      return 0;
    }

    const isFork = !toThreadId ||
      // check if this is CHAIN and fromRoot already has an out-going CHAIN
      // NOTE: this can happen, e.g. when multiple promises where then-chained to the same promise.
      (fromThreadId === toThreadId && this.hasChainFrom(fromRootId));

    if (isFork) {
      // fork!
      toThreadId = this.newThreadId();
      // warn("Trying to add CHAIN to an run already had outgoing CHAIN edge");
    }

    if (!previousToThreadId) {
      this.setRootThreadId(toRootId, toThreadId);
    }


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

    return toThreadId;
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

function getPromiseData(promise) {
  return promise._dbux_ || EmptyObject;
}


function getPromiseRootId(promise) {
  return promise._dbux_?.rootId;
}

function getPromiseOwnThreadId(promise) {
  return promise?._dbux_?.threadId;
}

function getPromiseOwnEdgeType(promise) {
  return promise?._dbux_?.edgeType;
}

function getPromiseOwnChainedToRoot(promise) {
  return promise?._dbux_?.chainedToRoot;
}

function getPromiseOwnAsyncFunctionContextId(promise) {
  return promise?._dbux_?.asyncFunctionContextId;
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
