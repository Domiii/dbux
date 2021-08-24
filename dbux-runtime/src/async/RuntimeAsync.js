import { newLogger } from '@dbux/common/src/log/logger';
import isThenable from '@dbux/common/src/util/isThenable';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { some } from 'lodash';
// import executionContextCollection from './data/executionContextCollection';
// import traceCollection from './data/traceCollection';
// import valueCollection from './data/valueCollection';
import { isFirstContextInParent, isRootContext, peekBCEContextCheckCallee } from '../data/dataUtil';
import ThenRef from '../data/ThenRef';
// eslint-disable-next-line max-len
import { getPromiseData, getPromiseId, getPromiseOwnAsyncFunctionContextId, setPromiseData } from './promisePatcher';
import asyncEventUpdateCollection from '../data/asyncEventUpdateCollection';
import executionContextCollection from '../data/executionContextCollection';
import { isPostEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
// import { isPostEventUpdate, isPreEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';

/** @typedef { import("./Runtime").default } Runtime */

export default class RuntimeAsync {
  logger = newLogger('Async');

  /**
   * @type {number} Maintain thread count
   */
  _maxThreadId = 0;

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
  getCurrentVirtualRootContextId() {
    return this._runtime.getCurrentVirtualRootContextId();
  }

  /**
   * We use this to associate `contextId` of an async function `f`, with its returned `promise`,
   * in the SPECIAL CASE of `then(f)`.
   */
  setAsyncContextPromise(contextId, promise) {
    const lastAwaitData = this.lastAwaitByRealContext.get(contextId);

    // eslint-disable-next-line max-len
    // this.logger.warn(`[traceCallPromiseResult] trace=${traceCollection.makeTraceInfo(trace.traceId)}, lastContextId=${executionContextCollection.getLastRealContext()?.contextId}`, calledContext?.contextId,
    //   lastAwaitData);

    if (lastAwaitData) {
      const promiseId = getPromiseId(promise);
      lastAwaitData.asyncFunctionPromiseId = promiseId;

      // NOTE: the function has already returned -> the first `preAwait` was already executed (but not been sent yet)
      // [edit-after-send]
      const lastUpdate = asyncEventUpdateCollection.getById(lastAwaitData.updateId);
      lastUpdate.promiseId = promiseId;
    }
    return lastAwaitData;
  }

  // ###########################################################################
  // preAwait
  // ###########################################################################

  /**
   * Track any created promise (that is the return value of a function or ctor call).
   */
  traceCallPromiseResult(contextId, trace, promise) {
    //   const currentRootId = this.getCurrentVirtualRootContextId();
    //   if (!isNewPromise(promise, currentRootId)) {
    //     // this.logger.warn('have seen promise before', currentRootId, promise._dbux_);
    //     return;
    //   }

    const callId = trace.resultCallId;
    const calledContext = peekBCEContextCheckCallee(callId);

    // if (callId === ) {
    //   const promiseId = getPromiseId(promise);
    //   const lastContext = executionContextCollection.getLastRealContext();
    //   const lastAwaitData = this.lastAwaitByRealContext.get(contextId);
    //   console.trace('traceCallPromiseResult',
    //     { callId, contextId, calledContext: !!calledContext, promiseId, trace, lastContext, lastAwaitData });
    // }

    let calledContextId;

    if (calledContext) {
      calledContextId = calledContext?.contextId;
      this.setAsyncContextPromise(calledContextId, promise);
    }
    //   // else if (!getFunctionRefByContext(executionContextCollection.getLastRealContext())) {
    //   //   // eslint-disable-next-line max-len
    //   //   this.logger.warn(`[traceCallPromiseResult] function is not instrumented, trace=${traceCollection.makeTraceInfo(trace.traceId)}, lastContextId=${executionContextCollection.getLastRealContext()?.contextId}`);
    //   // }

    //   // register previously unseen promise
    //   this.recordFloatingPromise(promise, currentRootId, lastAwaitData && calledContextId);

    //   // if (calledFirstAwaitPromise) {
    //   //   // const key = { runId, contextId, traceId };
    //   //   // this.runContextCallTracePromiseMap.set(key, promise);
    //   //   // this.promiseRunContextTraceMap.set(promise, key);
    //   // }
  }

  preAwait(awaitArgument, resumeContextId, realContextId, schedulerTraceId) {
    const currentRootId = this.getCurrentVirtualRootContextId();
    const currentRunId = this._runtime.getCurrentRunId();
    const awaitData = this.lastAwaitByRealContext.get(realContextId) || EmptyObject;
    const { asyncFunctionPromiseId } = awaitData;

    // store update
    const update = asyncEventUpdateCollection.addPreAwaitUpdate({
      runId: currentRunId,
      rootId: currentRootId,
      contextId: resumeContextId,
      schedulerTraceId, // preAwaitTid
      realContextId,
      promiseId: asyncFunctionPromiseId,
      nestedPromiseId: isThenable(awaitArgument) ? getPromiseId(awaitArgument) : 0
    });

    // TODO: add sync edge
    //    * if nested and promise already has `lastAsyncNode`
    //      -> add an edge from `preEvent` `AsyncNode` to promise's `lastAsyncNode`
    const isFirstAwait = isFirstContextInParent(resumeContextId);

    if (isRootContext(resumeContextId)) {
      // NOTE: this check is only necessary in case of a top-level `await`.
      //    -> since else: `!isFirstAwait` and `postAwait` just occured.
      // make sure that we have a valid threadId
      this.getOrAssignRootThreadId(resumeContextId);
    }

    this.updateLastAwaitByRealContext(realContextId, {
      resumeContextId,
      preAwaitRootId: currentRootId,
      isFirstAwait,
      schedulerTraceId,
      updateId: update.updateId
      // awaitArgument
    });

    const isNested = isThenable(awaitArgument);
    if (!isNested) {
      return;
    }

    /**
     * If `awaitArgument` is return value of `async` function, `nestedPromiseAsyncData` is its lastAwaitData
     */
    const nestedPromiseAsyncData = this.getPromiseLastAwait(awaitArgument);
    if (!nestedPromiseAsyncData) {
      // invalid data
      return;
    }

    if (!nestedPromiseAsyncData.firstAwaitingAsyncFunctionContextId) {
      // first nesting caller is part of the CHAIN
      nestedPromiseAsyncData.firstAwaitingAsyncFunctionContextId = realContextId;
    }

    this._preNestPromise(awaitArgument, currentRootId, schedulerTraceId);

    // this.logger.debug('this promise', promise, 'first await', isFirstAwait, 'is root', this.isRootContext(parentContextId));
    // if (!isFirstAwait || isRootContext(parentContextId)) {
    //   const threadId = this.getRootThreadId(currentRootId);
    //   this.setupPromise(awaitArgument, currentRootId, threadId, true);
    // }
  }

  _preNestPromise(promise, currentRootId, tid) {
    const {
      rootId: nestedRootId,
      firstEventRootId,
      firstNestingTraceId
    } = getPromiseData(promise);
    if (nestedRootId === currentRootId && !firstNestingTraceId) {
      setPromiseData(promise, {
        firstNestingTraceId: tid
      });
    }

    // later callers add SYNC edges to first root of `awaitArgument`
    if (!firstEventRootId) {
      // promise has not resolved its first event yet, so we add this context as pending
      // pushPromisePendingRootId(promise, currentRootId);
    }
    else {
      // this.addSyncEdge(currentRootId, firstEventRootId, AsyncEdgeType.SyncOut);
    }
  }


  recordFloatingPromise(promise, currentRootId, asyncFunctionContextId) {
    setPromiseData(promise, {
      // NOTE: rootId should already be set by recordPromise
      // rootId: currentRootId,
      // lastRootId: currentRootId,
      asyncFunctionContextId
    });
    this.floatingPromises.push(promise);
  }

  /** ###########################################################################
   * runtime basics
   *  #########################################################################*/

  virtualRootEnded(rootId) {
    // [edit-after-send]
    executionContextCollection.getById(rootId).isVirtualRoot = true;

    // // NOTE: add all unassigned roots to thread#1
    // this.setRootThreadId(rootId, 1);
  }


  // ###########################################################################
  // postAwait
  // ###########################################################################

  /**
   * TODO: also add a similar (but not the same) logic to `return` value of `async` functions.
   */
  postAwait(awaitContextId, realContextId, postEventContextId, awaitArgument) {
    const asyncData = this.lastAwaitByRealContext.get(realContextId);
    let {
      resumeContextId: preEventContextId,
      preAwaitRootId: preEventRootId,
      preEventThreadId,
      schedulerTraceId,
      asyncFunctionPromiseId
    } = asyncData;

    const postEventRootId = this.getCurrentVirtualRootContextId();
    const postEventRunId = this._runtime.getCurrentRunId();
    preEventThreadId = preEventThreadId || this.getOrAssignRootThreadId(preEventRootId);

    // store update
    asyncEventUpdateCollection.addPostAwaitUpdate({
      runId: postEventRunId,
      rootId: postEventRootId,
      contextId: postEventContextId,
      schedulerTraceId,
      realContextId,
      promiseId: asyncFunctionPromiseId,
      nestedPromiseId: isThenable(awaitArgument) ? getPromiseId(awaitArgument) : 0
    });

    // // update `rootId` for the next guy
    // asyncData.rootId = postEventRootId;

    // let fromRootId;
    // let fromThreadId;
    // let toThreadId;

    // const isFirstAwait = isFirstContextInParent(preEventContextId);
    // const isNested = isThenable(awaitArgument);
    // // const nestedAwaitData = isNested && this.getPromiseLastAwait(awaitArgument);
    // const nestedPromiseData = isNested && getPromiseData(awaitArgument);
    // const isNestedChain = nestedPromiseData?.firstNestingTraceId === schedulerTraceId;

    // if (!asyncFunctionPromise) {
    //   /* this.logger.error */
    //   // return;
    //   /* throw new Error */
    //   // eslint-disable-next-line max-len
    //   this.logger.error(`postAwait did not have "asyncFunctionPromise" at trace="${traceCollection.makeTraceInfo(schedulerTraceId)}", realContextId=${realContextId}, postEventRootId=${postEventRootId}, asyncData=${JSON.stringify(asyncData, null, 2)}`);
    //   return;
    // }

    // if (!isFirstAwait || this.isAsyncFunctionChainedToRoot(realContextId)) {
    //   // (1) not first await or (2) chained to root -> CHAIN
    //   toThreadId = preEventThreadId;
    // }
    // else if (isNestedChain) {
    //   // CHAIN with nested promise
    //   toThreadId = nestedPromiseData.threadId;
    // }
    // else {
    //   // first await, and NOT chained by caller and NOT chained to root -> FORK
    //   toThreadId = 0;
    // }

    // if (isNested) {
    //   /**
    //    * nested promise: 2 cases
    //    * 
    //    * Case 1: nested promise is chained into the same thread: add single edge
    //    * Case 2: nested promise is not chained: add a second SYNC edge
    //    */
    //   const {
    //     lastRootId: nestedRootId,
    //     threadId: nestedThreadId,
    //   } = nestedPromiseData;
    //   if (isNestedChain) {
    //     // Case 1
    //     fromRootId = nestedRootId;
    //     fromThreadId = nestedThreadId;
    //   }
    //   else {
    //     // Case 2: add SYNC edge
    //     this.addSyncEdge(nestedRootId, postEventRootId, AsyncEdgeType.SyncIn);

    //     // add edge from previous event, as usual
    //     fromRootId = preEventRootId;
    //     fromThreadId = preEventThreadId;
    //   }

    //   // TODO: complex nested syncs

    //   // // add SYNC edge for more waiting callers
    //   // const { pendingRootIds } = nestedPromiseData;
    //   // if (pendingRootIds && isFirstAwait) {
    //   //   for (const pendingRootId of pendingRootIds) {
    //   //     this.addSyncEdge(pendingRootId, postEventRootId, AsyncEdgeType.SyncIn);
    //   //   }
    //   // }
    // }
    // else {
    //   // not nested
    //   fromRootId = preEventRootId;
    //   fromThreadId = preEventThreadId;

    //   // // assign run <-> threadId
    //   // NOTE: this should probably not happen
    //   // let fromRootIdThreadId = getRunThreadId(fromRootId);
    //   // if (!fromRootIdThreadId) {
    //   //   // this.logger.debug("From run", fromRootId, "is a new run, assign thread id");
    //   //   fromRootIdThreadId = this.assignRunNewThreadId(fromRootId);
    //   // }
    // }

    // // add edge
    // const actualToThreadId = this.addEventEdge(fromRootId, postEventRootId, fromThreadId, toThreadId, schedulerTraceId, isNested);

    // // update promise data
    // if (isFirstAwait) {
    //   setPromiseData(asyncFunctionPromise, { threadId: actualToThreadId });
    // }

    // maybeSetPromiseFirstEventRootId(asyncFunctionPromise, postEventRootId);
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
  // Promises: preThen
  // ###########################################################################

  /**
   * Event: New promise (`postEventPromise`) has been scheduled.
   * @param {ThenRef} thenRef
   */
  preThen(thenRef) {
    const {
      preEventPromise,
      postEventPromise,
      schedulerTraceId
    } = thenRef;

    const runId = this._runtime.getCurrentRunId();
    const preEventRootId = this.getCurrentVirtualRootContextId();
    const contextId = this._runtime.peekCurrentContextId();

    // store update
    asyncEventUpdateCollection.addPreThenUpdate({
      runId,
      rootId: preEventRootId,
      contextId: contextId,
      schedulerTraceId,
      promiseId: getPromiseId(preEventPromise),
      postEventPromiseId: getPromiseId(postEventPromise)
    });

    // const rootId = this.getCurrentVirtualRootContextId();
    // this.logger.debug(`[preThen] #${rootId} ${getPromiseId(preEventPromise)} -> ${getPromiseId(postEventPromise)} (tid=${schedulerTraceId})`);
  }

  // ###########################################################################
  // Promises: postThen
  // ###########################################################################

  /**
   * Event: Promise has been settled.
   * 
   * @param {ThenRef} thenRef
   */
  postThen(thenRef, returnValue) {
    const {
      postEventPromise,
      schedulerTraceId
    } = thenRef;

    const runId = this._runtime.getCurrentRunId();
    const postEventRootId = this.getCurrentVirtualRootContextId();
    const contextId = this._runtime.peekCurrentContextId();

    if (!postEventRootId) {
      console.trace(`postThen`, getPromiseId(postEventPromise), thenRef, { runId, postEventRootId });
    }

    // store update
    asyncEventUpdateCollection.addPostThenUpdate({
      runId,
      rootId: postEventRootId,

      // NOTE: should have rootId === contextId
      contextId,

      schedulerTraceId,
      promiseId: getPromiseId(postEventPromise),
      nestedPromiseId: isThenable(returnValue) ? getPromiseId(returnValue) : 0
    });
  }

  // ###########################################################################
  // Promises: promiseConstructorCalled
  // ###########################################################################

  promiseCtorCalled(promiseId, previousLastUpdateId) {
    const lastUpdateId = asyncEventUpdateCollection.getLastId();


    for (let i = previousLastUpdateId + 1; i < lastUpdateId; ++i) {
      const update = asyncEventUpdateCollection.getById(i);

      if (!isPostEventUpdate(update.type)) {
        // [edit-after-send]
        update.promiseCtorId = promiseId;
      }
      else {
        // NOTE: Post events should not happen during promise ctor anyway
      }
    }
  }

  // ###########################################################################
  // Promises: resolve
  // ###########################################################################

  /**
   * Event: `resolve` or `reject` was called from a promise ctor's executor.
   * @param {ThenRef} thenRef
   */
  resolve(thenRef, resolveArg, resolveType) {
    const {
      preEventPromise,
      // postEventPromise,
      schedulerTraceId
    } = thenRef;

    const runId = this._runtime.getCurrentRunId();
    const preEventRootId = this.getCurrentVirtualRootContextId();
    const contextId = this._runtime.peekCurrentContextId();

    // store update
    asyncEventUpdateCollection.addResolveUpdate({
      runId,
      rootId: preEventRootId,
      contextId: contextId,
      schedulerTraceId,
      promiseId: getPromiseId(preEventPromise),

      argPromiseId: isThenable(resolveArg) && getPromiseId(resolveArg) || 0,
      resolveType
    });
  }

  // ###########################################################################
  // preCallback
  // ###########################################################################

  /**
   * Event: New callback (`postEventPromise`) has been scheduled.
   */
  preCallback(schedulerTraceId, isEventListener) {
    const runId = this._runtime.getCurrentRunId();
    const preEventRootId = this.getCurrentVirtualRootContextId();
    const contextId = this._runtime.peekCurrentContextId();

    // store update
    asyncEventUpdateCollection.addPreCallbackUpdate({
      runId,
      rootId: preEventRootId,
      contextId: contextId,
      schedulerTraceId,

      isEventListener
    });

    // const rootId = this.getCurrentVirtualRootContextId();
    // this.logger.debug(`[preCallback] #${rootId} ${getPromiseId(preEventPromise)} -> ${getPromiseId(postEventPromise)} (tid=${schedulerTraceId})`);
  }

  // ###########################################################################
  // postCallback
  // ###########################################################################

  /**
   * Event: Asynchronously scheduled callback is executed.
   * 
   * @param {CallbackRef} thenRef
   */
  postCallback(schedulerTraceId, runId, postEventRootId) {
    // console.trace(`postCallback`, getPromiseId(postEventPromise), '->', getPromiseId(returnValue));

    // store update
    asyncEventUpdateCollection.addPostCallbackUpdate({
      runId,
      rootId: postEventRootId,

      // NOTE: the last active root is also the `context` of the callback
      contextId: postEventRootId,
      schedulerTraceId
    });
  }




  // ###########################################################################
  // bookkeeping utilities
  // ###########################################################################

  updateLastAwaitByRealContext(realContextId, data) {
    const previousData = this.lastAwaitByRealContext.get(realContextId);
    data = {
      ...previousData,
      ...data
    };
    // if (!previousData) {
    //   this.logger.debug(`updateLastAwaitByRealContext (first await)`, realContextId, data);
    // }
    this.lastAwaitByRealContext.set(realContextId, data);
    return data;
  }

  getPromiseLastAwait(promise) {
    const nestedAsyncContextId = getPromiseOwnAsyncFunctionContextId(promise);
    const nestedAsyncData = nestedAsyncContextId && this.lastAwaitByRealContext.get(nestedAsyncContextId);
    if (nestedAsyncContextId && !nestedAsyncData) {
      this.logger.warn(`nestedAsyncData not found for asyncFunctionContextId=${nestedAsyncContextId}`);
      return null;
    }
    return nestedAsyncData;
  }

  /**
   * Used for debugging purposes.
   */
  debugGetAllRootIdsOfThread(threadId) {
    return Array.from(this.threadsByRoot.entries())
      .filter(([, t]) => t === threadId)
      .map(([r]) => r);
  }

  /**
   * Called when a run is finished.
   * @param {number} runId 
   */
  postRun(/* runId, rootContextIds */) {
    // NOTE: note currently necessary
    // for (const rootContextId of rootContextIds) {
    //   if (!this.getRootThreadId(rootContextId)) {
    //     // NOTE: rootContexts without any async event
    //     this.setRootThreadId(rootContextId, this.newThreadId());
    //   }
    // }
    this.processFloatingPromises();
  }

  /**
   * Maintain `threadsByRoot` map.
   * Called by `addEdge`.
   * 
   * @param {number} runId 
   * @param {number} threadId 
   */
  setRootThreadId(rootId, threadId, schedulerTraceId) {
    // const threadLastRun = Math.max(runId, this.lastRootContextByThread.get(threadId) || 0);
    // this.logger.debug(`[${threadId}] set runId=${runId}, threadLastRun=${threadLastRun}`);

    this.threadsByRoot.set(rootId, threadId);

    // TODO: remove all this
    // asyncNodeCollection.addAsyncNode(rootId, threadId, schedulerTraceId);
    // this.lastRootContextByThread.set(threadId, threadLastRun);
  }

  /**
   * 
   */
  getRootThreadId(rootId) {
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

  hasEdgeFromTo(fromRootId, firstEventRootId) {
    return !!this.outEdges[fromRootId]?.get(firstEventRootId);
  }

  /**
   * @return The new thread id
   */
  newThreadId() {
    // this.logger.debug("assign run new thread id", runId);
    ++this._maxThreadId;
    // eslint-disable-next-line no-console
    // this.logger.debug('[newThreadId]', this._maxThreadId);
    // console.trace('[newThreadId]', this._maxThreadId);
    return this._maxThreadId;
  }

  /**
   * If given root was started by a recorded async event, threadId is already assigned.
   * If not, we assume a FORK, and assign a new threadId.
   * 
   * TODO: move to `postRun` or `postRoot`?
   */
  getOrAssignRootThreadId(rootId) {
    let threadId = this.getRootThreadId(rootId);
    if (!threadId) {
      // NOTE: this can happen, if a root executed that was not connected to any previous asynchronous events
      //    (e.g. initial root, or caused by unrecorded asynchronous events)
      // this.logger.warn(`Tried to add edge from root ${fromRootId} but it did not have a threadId`);
      // return 0;
      this.setRootThreadId(rootId, threadId = this.newThreadId());
    }
    return threadId;
  }

  // ###########################################################################
  // addEdge
  // ###########################################################################

  // addSyncEdge(fromRootId, firstEventRootId, edgeType) {
  //   // eslint-disable-next-line max-len
  //   // this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}Edge] ${fromRootId}->${firstEventRootId}`);
  //   this.addEdge(fromRootId, firstEventRootId, edgeType);
  // }

  // /**
  //  * Add an edge between `fromRootId` and `toRootId`
  //  * @param {number} fromRootId 
  //  * @param {number} toRootId 
  //  */
  // addEventEdge(fromRootId, firstEventRootId, fromThreadId, toThreadId, schedulerTraceId, isNested) {
  //   // const previousFromThreadId = this.getOrAssignRootThreadId(fromRootId);
  //   const previousToThreadId = this.getRootThreadId(firstEventRootId);

  //   const isFork = !toThreadId ||
  //     // check if this is CHAIN and fromRoot already has an out-going CHAIN
  //     // NOTE: this can happen, e.g. when the same promise's `then` was called multiple times.
  //     (fromThreadId === toThreadId && this.hasChainFrom(fromRootId));

  //   if (isFork) {
  //     // fork!
  //     toThreadId = this.newThreadId();
  //   }

  //   if (!previousToThreadId) {
  //     // toRootId was not assigned to any thread yet
  //     this.setRootThreadId(firstEventRootId, toThreadId, schedulerTraceId);
  //   }

  //   // add edge
  //   const edgeType = fromThreadId !== toThreadId ? AsyncEdgeType.Fork : AsyncEdgeType.Chain;
  //   if (!this.addEdge(fromRootId, firstEventRootId, edgeType)) {
  //     return 0;
  //   }

  //   // eslint-disable-next-line max-len
  //   // this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}] [${fromThreadId !== toThreadId ? `${fromThreadId}->` : ''}${toThreadId}] Roots: ${fromRootId}->${firstEventRootId} (tid=${schedulerTraceId}${isNested ? `, nested` : ''})`);

  //   return toThreadId;
  // }

  // addEdge(fromRootId, firstEventRootId, edgeType) {
  //   if (!fromRootId || !firstEventRootId) {
  //     this.logger.error(new Error(
  //       `Tried to add invalid ${AsyncEdgeType.nameFromForce(edgeType)} edge, from root ${fromRootId} to ${firstEventRootId}`
  //     ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => $
  //     return false;
  //   }
  //   if (this.hasEdgeFromTo(fromRootId, firstEventRootId)) {
  //     this.logger.error(new Error(
  //       `Tried to add ${AsyncEdgeType.nameFromForce(edgeType)} edge, but there already was one, from ${fromRootId} to ${firstEventRootId}`
  //     ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => ${toThreadId})`);
  //     return false;
  //   }

  //   if (!this.outEdges[fromRootId]) {
  //     this.outEdges[fromRootId] = new Map();
  //   }
  //   if (!this.inEdges[firstEventRootId]) {
  //     this.inEdges[firstEventRootId] = new Map();
  //   }
  //   this.outEdges[fromRootId].set(firstEventRootId, 1);
  //   this.inEdges[firstEventRootId].set(fromRootId, 1);

  //   // TODO: get rid of all of this
  //   // asyncEventCollection.addEdge(fromRootId, firstEventRootId, edgeType);
  //   return true;
  // }

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
