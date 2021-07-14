import { newLogger } from '@dbux/common/src/log/logger';
import isThenable from '@dbux/common/src/util/isThenable';
import AsyncEdgeType from '@dbux/common/src/core/constants/AsyncEdgeType';
import { some } from 'lodash';
import asyncEventCollection from '../data/asyncEventCollection';
import asyncNodeCollection from '../data/asyncNodeCollection';
// import executionContextCollection from './data/executionContextCollection';
// import traceCollection from './data/traceCollection';
// import valueCollection from './data/valueCollection';
import { getBCEContext, isFirstContextInParent, isRootContext } from '../data/dataUtil';
import ThenRef from '../data/ThenRef';
// eslint-disable-next-line max-len
import { getPromiseData, getPromiseFirstEventRootId, getPromiseId, getPromiseOwnAsyncFunctionContextId, isNewPromise, maybeSetPromiseFirstEventRootId, pushPromisePendingRootId, setPromiseData } from './patchPromise';

/** @typedef { import("./Runtime").default } Runtime */

export class AsyncRuntime {
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

  // ###########################################################################
  // preAwait
  // ###########################################################################

  /**
   * Track any created promise (that is the return value of a function or ctor call).
   */
  traceCallPromiseResult(contextId, trace, promise) {
    const currentRootId = this.getCurrentVirtualRootContextId();
    if (!isNewPromise(promise, currentRootId)) {
      // this.logger.warn('have seen promise before', currentRootId, promise._dbux_);
      return;
    }

    const callId = trace.resultCallId;
    const calledContext = getBCEContext(callId);

    let calledContextId;
    let lastAwaitData;

    if (calledContext) {
      calledContextId = calledContext?.contextId;
      lastAwaitData = this.lastAwaitByRealContext.get(calledContextId);
      if (lastAwaitData?.isFirstAwait) { // NOTE: in this case, `isFirstAwait` should always be true, if exists
        // -> this is the return value of `calledContextId`
        // -> this should be the caller of `calledContextId`

        // NOTE: establish async caller chain
        lastAwaitData.asyncFunctionPromise = promise;
      }
    }

    // register previously unseen promise
    this.recordFloatingPromise(promise, currentRootId, lastAwaitData && calledContextId);

    // if (calledFirstAwaitPromise) {
    //   // const key = { runId, contextId, traceId };
    //   // this.runContextCallTracePromiseMap.set(key, promise);
    //   // this.promiseRunContextTraceMap.set(promise, key);
    // }
  }

  preAwait(awaitArgument, resumeContextId, realContextId, preAwaitTid) {
    const currentRootId = this.getCurrentVirtualRootContextId();
    // this.logger.debug('pre await', awaitArgument);

    // this.floatingPromises.delete(awaitArgument);
    // this.logger.debug('delete floating promise', awaitArgument);


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

    this.lastAwaitByRealContext.set(realContextId, {
      resumeContextId,
      preAwaitRootId: currentRootId,
      isFirstAwait,
      preAwaitTid
      // awaitArgument
    });

    const isNested = isThenable(awaitArgument);
    if (!isNested) {
      return;
    }

    const nestedAsyncData = this.getPromiseLastAwait(awaitArgument);
    if (!nestedAsyncData) {
      // invalid data issue
      return;
    }

    if (!nestedAsyncData.firstAwaitingAsyncFunctionContextId) {
      // first nesting caller is part of the CHAIN
      nestedAsyncData.firstAwaitingAsyncFunctionContextId = realContextId;
    }
    else {
      // later callers add SYNC edges to first root of `awaitArgument`
      const toRootId = getPromiseFirstEventRootId(awaitArgument);
      if (!toRootId) {
        // promise has not resolved its first event yet, so we add this context as pending
        pushPromisePendingRootId(awaitArgument, currentRootId);
      }
      else {
        this.addSyncEdge(currentRootId, toRootId);
      }
    }

    // this.logger.debug('this promise', promise, 'first await', isFirstAwait, 'is root', this.isRootContext(parentContextId));
    // if (!isFirstAwait || isRootContext(parentContextId)) {
    //   const threadId = this.getRootThreadId(currentRootId);
    //   this.setupPromise(awaitArgument, currentRootId, threadId, true);
    // }
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
      preAwaitTid,
      asyncFunctionPromise
    } = asyncData;

    const postEventRootId = this.getCurrentVirtualRootContextId();
    preEventThreadId = preEventThreadId || this.getOrAssignRootThreadId(preEventRootId);

    // // update `rootId` for the next guy
    // asyncData.rootId = postEventRootId;

    let fromRootId;
    let fromThreadId;
    let toThreadId;

    const isFirstAwait = isFirstContextInParent(preEventContextId);
    const isNested = isThenable(awaitArgument);
    const nestedAwaitData = isNested && this.getPromiseLastAwait(awaitArgument);
    const nestedPromiseData = isNested && getPromiseData(awaitArgument);
    const isNestedChain = nestedAwaitData?.firstAwaitingAsyncFunctionContextId === realContextId;

    if (!isFirstAwait || this.isAsyncFunctionChainedToRoot(realContextId)) {
      // (1) not first await or (2) chained to root  -> CHAIN
      toThreadId = preEventThreadId;
    }
    else if (isNestedChain) {
      // CHAIN with nested promise
      toThreadId = nestedPromiseData.threadId;
    }
    else {
      // first await, and NOT chained by caller and NOT chained to root -> FORK
      toThreadId = 0;
    }

    if (isFirstAwait) {
      // set firstEventRootId
      maybeSetPromiseFirstEventRootId(asyncFunctionPromise, postEventRootId);
    }

    if (isNested) {
      /**
       * nested promise: 2 cases
       * 
       * Case 1: nested promise is chained into the same thread: add single edge
       * Case 2: nested promise is not chained: add a second SYNC edge
       */
      const {
        lastRootId: nestedRootId,
        threadId: nestedThreadId,
      } = nestedPromiseData;
      if (isNestedChain) {
        // Case 1
        fromRootId = nestedRootId;
        fromThreadId = nestedThreadId;
      }
      else {
        // Case 2: add SYNC edge
        this.addSyncEdge(nestedRootId, postEventRootId);

        // add edge from previous event, as usual
        fromRootId = preEventRootId;
        fromThreadId = preEventThreadId;
      }

      // add SYNC edge for more waiting callers
      const { pendingRootIds } = nestedPromiseData;
      if (pendingRootIds && isFirstAwait) {
        for (const pendingRootId of pendingRootIds) {
          this.addSyncEdge(pendingRootId, postEventRootId);
        }
      }
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
        `Runs=${this.debugGetAllRootIdsOfThread(preEventThreadId)} (Skipped).`
      );
    }

    // add edge
    const actualToThreadId = this.addEventEdge(fromRootId, postEventRootId, fromThreadId, toThreadId, preAwaitTid, isNested);

    if (isFirstAwait) {
      setPromiseData(asyncFunctionPromise, {
        threadId: actualToThreadId,
        lastRootId: postEventRootId
      });
    }
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
  // Promises: thenScheduled
  // ###########################################################################

  /**
   * Event: New promise (`postEventPromise`) has been scheduled.
   * @param {ThenRef} thenRef
   */
  thenScheduled(thenRef) {
    const {
      preEventPromise,
      postEventPromise,
      schedulerTraceId
    } = thenRef;

    const rootId = this.getCurrentVirtualRootContextId();
    this.logger.debug(`[thenScheduled] #${rootId} ${getPromiseId(preEventPromise)} -> ${getPromiseId(postEventPromise)} (tid=${schedulerTraceId})`);
  }

  // ###########################################################################
  // Promises: thenExecuted
  // ###########################################################################

  /**
   * Event: Promise has been settled.
   * 
   * @param {ThenRef} thenRef
   */
  thenExecuted(thenRef, returnValue) {
    const {
      preEventPromise,
      postEventPromise,
      schedulerTraceId
    } = thenRef;
    const {
      threadId: preEventThreadId,
      lastRootId: preEventRootId
    } = getPromiseData(preEventPromise);

    // const {
    //   rootId: scheduleRootId
    // } = getPromiseData(postEventPromise);

    const postEventRootId = this.getCurrentVirtualRootContextId();
    const fromThreadId = preEventThreadId;
    let toThreadId;
    const isNested = isThenable(returnValue);

    if (isNested) {
      toThreadId = TODO;
    }
    else {
      // don't chain if is first promise and not chained to root
      if (!isFirstPromise || isPromiseChainedToRoot) {
        // CHAIN
        toThreadId = preEventThreadId;
      }
      else {
        // FORK
        toThreadId = 0;
      }
    }

    const actualToThreadId = this.addEventEdge(preEventRootId, postEventRootId, fromThreadId, toThreadId, schedulerTraceId, isNested);

    // TODO: also don't set `threadId` on async result promises?
    // TODO: keep set of all "promise dependencies" and resolve on next promise event

    if (!getPromiseData(postEventPromise).threadId) {
      // don't override previous `threadId`
      setPromiseData(postEventPromise, {
        threadId: actualToThreadId
        // lastRootId: postEventRootId
      });
    }
  }


  // ###########################################################################
  // bookkeeping utilities
  // ###########################################################################

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
   * Traverse nested awaits, to find out, if outer-most await is in root.
   * @return {boolean}
   */
  isAsyncFunctionChainedToRoot(realContextId) {
    // NOTE: asyncData should always exist, since we are calling this `postAwait`
    const asyncData = this.lastAwaitByRealContext.get(realContextId);

    const {
      // asyncFunctionContextId,
      // threadId,
      // asyncFunctionPromise,
      isFirstAwait,
      firstAwaitingAsyncFunctionContextId
    } = asyncData;

    // NOTE: `this.getAsyncFunctionChainedToRoot` uses firstAwaitingAsyncFunctionContextId
    //    -> what if await, but its not first?
    //    -> TODO: add synchronization links (out and back in)

    if (!isFirstAwait) {
      // chained to ResumeContext
      return true;
    }

    if (!firstAwaitingAsyncFunctionContextId) {
      return isRootContext(realContextId);
    }
    else {
      // first await in first await -> keep going up
      return this.isAsyncFunctionChainedToRoot(firstAwaitingAsyncFunctionContextId);
    }

    // const parentContextId = getPromiseOwnAsyncFunctionContextId(asyncFunctionPromise);


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

    asyncNodeCollection.addAsyncNode(rootId, threadId, schedulerTraceId);
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

  addSyncEdge(fromRootId, toRootId) {
    // eslint-disable-next-line max-len
    this.logger.debug(`[addSyncEdge] Roots: ${fromRootId}->${toRootId}`);
    this.addEdge(fromRootId, toRootId, AsyncEdgeType.Sync);
  }

  /**
   * Add an edge between `fromRootId` and `toRootId`
   * @param {number} fromRootId 
   * @param {number} toRootId 
   */
  addEventEdge(fromRootId, toRootId, fromThreadId, toThreadId, schedulerTraceId, isNested) {
    const previousFromThreadId = this.getOrAssignRootThreadId(fromRootId);
    const previousToThreadId = this.getRootThreadId(toRootId);

    const isFork = !toThreadId ||
      // check if this is CHAIN and fromRoot already has an out-going CHAIN
      // NOTE: this can happen, e.g. when the same promise's `then` was called multiple times.
      (fromThreadId === toThreadId && this.hasChainFrom(fromRootId));

    if (isFork) {
      // fork!
      toThreadId = this.newThreadId();
    }

    if (!previousToThreadId) {
      // toRootId was not assigned to any thread yet
      this.setRootThreadId(toRootId, toThreadId, schedulerTraceId);
    }

    // add edge
    const edgeType = fromThreadId !== toThreadId ? AsyncEdgeType.Fork : AsyncEdgeType.Chain;
    if (!this.addEdge(fromRootId, toRootId, edgeType)) {
      return 0;
    }

    // eslint-disable-next-line max-len
    this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}] [${fromThreadId !== toThreadId ? `${fromThreadId}->` : ''}${toThreadId}] Roots: ${fromRootId}->${toRootId} (tid=${schedulerTraceId}${isNested ? `, nested` : ''})`);

    return toThreadId;
  }

  addEdge(fromRootId, toRootId, edgeType) {
    if (!fromRootId || !toRootId) {
      this.logger.error(new Error(
        `Tried to add invalid ${AsyncEdgeType.nameFromForce(edgeType)} edge, from ${fromRootId} to ${toRootId}`
      ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => $
      return false;
    }
    if (this.hasEdgeFromTo(fromRootId, toRootId)) {
      this.logger.error(new Error(
        `Tried to add ${AsyncEdgeType.nameFromForce(edgeType)} edge, but there already was one, from ${fromRootId} to ${toRootId}`
      ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => ${toThreadId})`);
      return false;
    }

    if (!this.outEdges[fromRootId]) {
      this.outEdges[fromRootId] = new Map();
    }
    if (!this.inEdges[toRootId]) {
      this.inEdges[toRootId] = new Map();
    }
    this.outEdges[fromRootId].set(toRootId, 1);
    this.inEdges[toRootId].set(fromRootId, 1);

    asyncEventCollection.addEdge(fromRootId, toRootId, edgeType);
    return true;
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
