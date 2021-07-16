import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import AsyncEventUpdateType from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import Collection from '../Collection';

/** @typedef { import("@dbux/common/src/types/AsyncEventUpdate").AsyncEventUpdate } AsyncEventUpdate */

/**
 * @extends {Collection<AsyncEventUpdate>}
 */
export default class AsyncEventUpdateCollection extends Collection {
  handlersByType = [];

  constructor(dp) {
    super('asyncEventUpdates', dp);

    this.handlersByType[AsyncEventUpdateType.AsyncCall] = this.asyncCall;
    this.handlersByType[AsyncEventUpdateType.PreAwait] = this.preAwait;
    this.handlersByType[AsyncEventUpdateType.PostAwait] = this.postAwait;
    this.handlersByType[AsyncEventUpdateType.PreThen] = this.preThen;
    this.handlersByType[AsyncEventUpdateType.PostThen] = this.postThen;
  }

  postIndexRaw(updates) {
    for (const update of updates) {
      const { type } = update;
      const handler = this.handlersByType[type];

      if (!handler) {
        this.logger.error(`Invalid AsyncEventUpdateType: ${type} in update`, update);
      }
      else {
        handler(update);
      }
    }
  }

  // ###########################################################################
  // await/async
  // ###########################################################################

  preAwait = update => {

  }

  postAwait = update => {
    const { dp } = this;

    const {
      rootId: postEventRootId,
      realContextId,
      schedulerTraceId,
      postEventContextId
    } = update;

    // const bceTrace = dp.util.getOwnCallerTraceOfContext(realContextId);
    const returnPromiseId = dp.util.getReturnValueRefOfContext(realContextId)?.refId;
    if (!returnPromiseId) {
      // should never happen!
      this.logger.warn(`[postAwait] "getReturnValueRefOfContext" failed:`, update);
      return;
    }

    const preEventUpdate = getPreEventUpdate();

    if (!preEventUpdate) {
      // should never happen!
      this.logger.warn(`[postAwait] "getPreEventUpdate" failed:`, { returnPromiseId }, update);
      return;
    }

    const {
      rootId: preEventRootId,
      preEventContextId,
      nestedPromiseId
    } = preEventUpdate;

    const isFirstAwait = dp.util.isFirstContextInParent(preEventContextId); // same as `preEventContextId !== preEventRootId`
    const isNested = !!nestedPromiseId;
    const isNestedChain = nestedPromiseData?.firstNestingTraceId === schedulerTraceId;

    let fromRootId;
    const toRootId = postEventRootId;
    let fromThreadId, toThreadId;

    if (!isFirstAwait || this.isPromiseChainedToRoot(returnPromiseId)) {
      // (1) not first await OR (2) chained to root -> CHAIN
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
        this.addSyncEdge(nestedRootId, postEventRootId, AsyncEdgeType.SyncIn);

        // add edge from previous event, as usual
        fromRootId = preEventRootId;
        fromThreadId = preEventThreadId;
      }

      // TODO: complex nested syncs

      // // add SYNC edge for more waiting callers
      // const { pendingRootIds } = nestedPromiseData;
      // if (pendingRootIds && isFirstAwait) {
      //   for (const pendingRootId of pendingRootIds) {
      //     this.addSyncEdge(pendingRootId, postEventRootId, AsyncEdgeType.SyncIn);
      //   }
      // }
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

    // add edge
    const actualToThreadId = this.addEventEdge(fromRootId, postEventRootId, fromThreadId, toThreadId, schedulerTraceId, isNested);

    // update promise data
    if (isFirstAwait) {
      setPromiseData(asyncFunctionPromise, { threadId: actualToThreadId });
    }

    maybeSetPromiseFirstEventRootId(asyncFunctionPromise, postEventRootId);
  }

  // ###########################################################################
  // promises
  // ###########################################################################

  preThen = update => {

  }

  postThen = update => {

  }

  // ###########################################################################
  // utility
  // ###########################################################################

  isPromiseChainedToRoot(promiseId) {
    const { dp } = this;
    
    const firstAwaitingAsyncFunctionContextId = this.(promiseId);

    if (!firstAwaitingAsyncFunctionContextId) {
      return isRootContext(realContextId);
    }
    else {
      // first await in first await -> keep going up
      return this.isPromiseChainedToRoot(firstAwaitingAsyncFunctionContextId);
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


  // ###########################################################################
  // addEdge
  // ###########################################################################

  addSyncEdge(fromRootId, firstEventRootId, edgeType) {
    // eslint-disable-next-line max-len
    this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}Edge] ${fromRootId}->${firstEventRootId}`);
    this.addEdge(fromRootId, firstEventRootId, edgeType);
  }

  /**
   * Add an edge between `fromRootId` and `toRootId`
   * @param {number} fromRootId 
   * @param {number} toRootId 
   */
  addEventEdge(fromRootId, firstEventRootId, fromThreadId, toThreadId, schedulerTraceId, isNested) {
    // const previousFromThreadId = this.getOrAssignRootThreadId(fromRootId);
    const previousToThreadId = this.getRootThreadId(firstEventRootId);

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
      this.setRootThreadId(firstEventRootId, toThreadId, schedulerTraceId);
    }

    // add edge
    const edgeType = fromThreadId !== toThreadId ? AsyncEdgeType.Fork : AsyncEdgeType.Chain;
    if (!this.addEdge(fromRootId, firstEventRootId, edgeType)) {
      return 0;
    }

    // eslint-disable-next-line max-len
    this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}] [${fromThreadId !== toThreadId ? `${fromThreadId}->` : ''}${toThreadId}] Roots: ${fromRootId}->${firstEventRootId} (tid=${schedulerTraceId}${isNested ? `, nested` : ''})`);

    return toThreadId;
  }

  addEdge(fromRootId, firstEventRootId, edgeType) {
    if (!fromRootId || !firstEventRootId) {
      this.logger.error(new Error(
        `Tried to add invalid ${AsyncEdgeType.nameFromForce(edgeType)} edge, from root ${fromRootId} to ${firstEventRootId}`
      ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => $
      return false;
    }
    if (this.hasEdgeFromTo(fromRootId, firstEventRootId)) {
      this.logger.error(new Error(
        `Tried to add ${AsyncEdgeType.nameFromForce(edgeType)} edge, but there already was one, from ${fromRootId} to ${firstEventRootId}`
      ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => ${toThreadId})`);
      return false;
    }

    if (!outEdges[fromRootId]) {
      outEdges[fromRootId] = new Map();
    }
    outEdges[fromRootId].set(firstEventRootId, 1);

    asyncEventCollection.addEdge(fromRootId, firstEventRootId, edgeType);
    return true;
  }
}
