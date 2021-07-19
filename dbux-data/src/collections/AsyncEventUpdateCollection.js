import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import AsyncEventUpdateType from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import Collection from '../Collection';

/** @typedef { import("@dbux/common/src/types/AsyncEventUpdate").AsyncEventUpdate } AsyncEventUpdate */

/**
 * @extends {Collection<AsyncEventUpdate>}
 */
export default class AsyncEventUpdateCollection extends Collection {
  handlersByType = [];

  // ###########################################################################
  // type ctor + handlers
  // ###########################################################################

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
      schedulerTraceId
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
      runId: preEventRunId,
      rootId: preEventRootId,
      contextId: preEventContextId,
      nestedPromiseId
    } = preEventUpdate;

    const preEventThreadId = this.getOrAssignRootThreadId(preEventRootId);
    const isFirstAwait = dp.util.isFirstContextInParent(preEventContextId); 

    const isNested = !!nestedPromiseId;
    const nestingAsyncUpdates = nestedPromiseId && this.getNestingAsyncUpdates(preEventRunId, nestedPromiseId);
    const firstNestingTraceId = nestingAsyncUpdates?.[0].schedulerTraceId;
    const isNestedChain = firstNestingTraceId === schedulerTraceId;

    let fromRootId;
    const toRootId = postEventRootId;
    let fromThreadId, toThreadId;

    if (!isFirstAwait || this.isPromiseChainedToRoot(preEventRunId, returnPromiseId)) {
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
    const newEdge = this.addEventEdge(fromRootId, postEventRootId, fromThreadId, toThreadId, schedulerTraceId, isNested);

    // // update promise data
    // if (isFirstAwait) {
    //   setPromiseData(asyncFunctionPromise, { threadId: actualToThreadId });
    // }

    // maybeSetPromiseFirstEventRootId(asyncFunctionPromise, postEventRootId);
  }

  // ###########################################################################
  // promises
  // ###########################################################################

  preThen = update => {

  }

  postThen = update => {

  }

  // ###########################################################################
  // thread management
  // ###########################################################################

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
   * If given root was started by a previous async event, threadId is already assigned.
   * If not, we assume a FORK, and assign a new threadId.
   */
  getOrAssignRootThreadId(rootId) {
    let threadId = this.dp.util.getRootThreadId(rootId);
    if (!threadId) {
      // NOTE: this can happen, if a root executed that was not connected to any previous asynchronous events
      //    (e.g. initial root, or caused by unrecorded asynchronous events)
      // this.logger.warn(`Tried to add edge from root ${fromRootId} but it did not have a threadId`);
      // return 0;
      const schedulerTraceId = 0;
      this.dp.collections.asyncNodes.addAsyncNode(rootId, threadId = this.newThreadId(), schedulerTraceId);
    }
    return threadId;
  }

  // ###########################################################################
  // more utilities
  // ###########################################################################

  getNestingAsyncUpdates(runId, promiseId) {
    const { dp } = this;
    const eventKey = { runId, nestedPromiseId: promiseId };
    return dp.indexes.asyncEventUpdates.byNestedPromise.get(eventKey);
  }

  getFirstNestingAsyncUpdate(runId, promiseId) {
    return this.getNestingAsyncUpdates(runId, promiseId)?.[0] || null;
  }

  isPromiseChainedToRoot(runId, promiseId) {
    // const { dp } = this;
    const firstNestingAsyncUpdate = this.getFirstNestingAsyncUpdate(runId, promiseId);
    const { contextId, rootId, returnPromiseId } = firstNestingAsyncUpdate;

    if (contextId === rootId) {
      return true;
    }

    if (returnPromiseId) {
      // contextId !== rootId -> (most likely?) a first await
      return this.isPromiseChainedToRoot(runId, returnPromiseId);
    }

    return false;

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
      this.dp.collections.asyncNodes.addAsyncNode(firstEventRootId, toThreadId, schedulerTraceId);
    }

    // add edge
    const edgeType = fromThreadId !== toThreadId ? AsyncEdgeType.Fork : AsyncEdgeType.Chain;
    const newEdge = this.addEdge(fromRootId, firstEventRootId, edgeType);
    if (!newEdge) {
      return null;
    }

    // eslint-disable-next-line max-len
    this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}] [${fromThreadId !== toThreadId ? `${fromThreadId}->` : ''}${toThreadId}] Roots: ${fromRootId}->${firstEventRootId} (tid=${schedulerTraceId}${isNested ? `, nested` : ''})`);

    return newEdge;
  }

  addEdge(fromRootId, firstEventRootId, edgeType) {
    if (!fromRootId || !firstEventRootId) {
      this.logger.error(new Error(
        `Tried to add invalid ${AsyncEdgeType.nameFromForce(edgeType)} edge, from root ${fromRootId} to ${firstEventRootId}`
      ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => $
      return null;
    }

    if (this.hasEdgeFromTo(fromRootId, firstEventRootId)) {
      this.logger.error(new Error(
        `Tried to add ${AsyncEdgeType.nameFromForce(edgeType)} edge, but there already was one, from ${fromRootId} to ${firstEventRootId}`
      ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => ${toThreadId})`);
      return null;
    }

    // if (!outEdges[fromRootId]) {
    //   outEdges[fromRootId] = new Map();
    // }
    // outEdges[fromRootId].set(firstEventRootId, 1);

    const { dp } = this;
    return dp.collections.asyncEventCollection.addEdge(fromRootId, firstEventRootId, edgeType);
  }
}
