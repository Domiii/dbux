import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import AsyncEventUpdateType, { isAwaitEvent } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import AsyncEventUpdate, { PostAwaitUpdate } from '@dbux/common/src/types/AsyncEventUpdate';
import Collection from '../Collection';

/** @typedef { import("@dbux/common/src/types/AsyncEventUpdate").AsyncEventUpdate } AsyncEventUpdate */

/**
 * @extends {Collection<AsyncEventUpdate>}
 */
export default class AsyncEventUpdateCollection extends Collection {
  _maxThreadId = 1;
  handlersByType = [];

  // ###########################################################################
  // type ctor + handlers
  // ###########################################################################

  constructor(dp) {
    super('asyncEventUpdates', dp);

    this.handlersByType[AsyncEventUpdateType.PreAwait] = this.preAwait;
    this.handlersByType[AsyncEventUpdateType.PostAwait] = this.postAwait;
    this.handlersByType[AsyncEventUpdateType.PreThen] = this.preThen;
    this.handlersByType[AsyncEventUpdateType.PostThen] = this.postThen;
    this.handlersByType[AsyncEventUpdateType.Resolve] = this.resolve;
    this.handlersByType[AsyncEventUpdateType.PreCallback] = this.preCallback;
    this.handlersByType[AsyncEventUpdateType.PostCallback] = this.postCallback;
  }

  /**
   * Pre-process updates to collect data used by indexes and `postIndexRaw`.
   */
  postAddRaw(updates) {
    const { dp } = this;

    for (const update of updates) {
      // const bceTrace = dp.util.getOwnCallerTraceOfContext(realContextId);
      if (isAwaitEvent(update.type)) {
        // set async function's `promiseId`
        const { realContextId } = update;

        // NOTE: `getCallValueRefOfContext` might not return anything for `f`'s contextId in case of `then(f)`
        //    -> we handle that case in `patchedPromiseCb`
        update.promiseId = update.promiseId || dp.util.getCallValueRefOfContext(realContextId)?.refId;   // returnPromiseId
        // if (!update.promiseId) {
        //   // should never happen!
        //   this.logger.warn(`postAddRaw [${AsyncEventUpdateType.nameFromForce(update.type)}] "getCallValueRefOfContext" failed:`, update);
        // }
      }
    }
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

  /**
   * @param {PreAwaitUpdate} update
   */
  preAwait = update => {
    // const { dp } = this;
    // const {
    //   rootId: preEventRootId,
    //   nestedPromiseId
    // } = update;


    // const nestedUpdate = nestedPromiseId && dp.util.getFirstPostOrResolveAsyncEventOfPromise(nestedPromiseId, preEventRootId);
    // if (nestedUpdate?.rootId <= preEventRootId) {
    //   console.trace(`[preAwait] addSyncEdge ${preEventRootId}, nestedUpdate=`, nestedUpdate);
    //   this.addSyncEdge(preEventRootId, nestedUpdate.rootId, AsyncEdgeType.SyncOut);
    // }
  }

  /**
   * @param {PostAwaitUpdate} postEventUpdate 
   */
  postAwait = postEventUpdate => {
    const { /* dp,  */dp: { util } } = this;

    const {
      // rootId: postEventRootId,
      schedulerTraceId,
      // promiseId
    } = postEventUpdate;

    const postUpdateData = util.getPostAwaitData(postEventUpdate);
    if (!postUpdateData) {
      // NOTE: should not happen
      return;
    }

    const {
      preEventUpdate: {
        rootId: preEventRootId
      },
      rootIdNested
    } = postUpdateData;
    this.getOrAssignRootThreadId(preEventRootId, schedulerTraceId);
    this.getOrAssignRootThreadId(rootIdNested, schedulerTraceId);

    // add edge
    /* const newEdge =  */
    this.addEventEdge(postUpdateData, schedulerTraceId);
  }

  // ###########################################################################
  // promises
  // ###########################################################################

  preThen = update => {

  }

  postThen = postEventUpdate => {
    const { /* dp,  */dp: { util } } = this;

    const {
      // runId: postEventRunId,
      rootId: postEventRootId,
      // NOTE: the last active root is also the `context` of the `then` callback
      // contextId,
      schedulerTraceId
    } = postEventUpdate;

    const postUpdateData = util.getPostThenData(postEventUpdate);
    if (!postUpdateData) {
      // NOTE: should not happen
      return;
    }

    const {
      preEventUpdate: {
        rootId: preEventRootId
      },
      rootIdNested
    } = postUpdateData;

    this.getOrAssignRootThreadId(preEventRootId, schedulerTraceId);
    this.getOrAssignRootThreadId(rootIdNested, schedulerTraceId);

    // add edge
    /* const newEdge =  */
    this.addEventEdge(postUpdateData, schedulerTraceId);

    // const parent = firstNestedBy || preThenPromise;
    // const parentRootId = parent && 
    // const preEventRootId = Math.max(
    //   firstNestedBy && getPromiseAnyRootId(firstNestedBy) || -1,
    //   preThenPromise && getPromiseAnyRootId(preThenPromise) || -1,
    //   lastRootId || -1,
    //   createdRootId
    // );
    // console.debug(preEventRootId, schedulerTraceId,
    //   getPromiseData(preThenPromise),
    //   getPromiseData(preThenPromise) && getPromiseData(getPromiseData(preThenPromise).preThenPromise),
    //   [
    //     firstNestedBy && getPromiseAnyRootId(firstNestedBy) || -1,
    //     preThenPromise && getPromiseAnyRootId(preThenPromise) || -1,
    //     lastRootId || -1,
    //     createdRootId
    //   ]);

    // maybeSetPromiseFirstEventRootId(preEventPromise, this.getCurrentVirtualRootContextId());
    // maybeSetPromiseFirstEventRootId(postEventPromise, this.getCurrentVirtualRootContextId());

    // resolve `fromThreadId`

    // resolve `toThreadId`
    // let toThreadId;
    // const isFirstPromise = !lastRootId;
    // // don't chain if is first promise and not chained to root
    // if (!isFirstPromise || this.isPromiseChainedToRoot(preEventRunId, promiseId)) {
    //   // CHAIN
    //   toThreadId = preEventThreadId;
    // }
    // else {
    //   // FORK
    //   toThreadId = 0;
    // }

    // const actualToThreadId = this.addEventEdge(preEventRootId, postEventRootId, fromThreadId, toThreadId, schedulerTraceId);

    // TODO: also don't set `threadId` on async result promises?
    // TODO: keep set of all "promise dependencies" and resolve on next promise event

    // if (!getPromiseData(postEventPromise).threadId) {
    //   // don't override previous `threadId`
    //   setPromiseData(postEventPromise, {
    //     threadId: actualToThreadId
    //     // lastRootId: postEventRootId
    //   });
    // }
  }

  resolve = update => {

  }

  // ###########################################################################
  // callbacks
  // ###########################################################################

  preCallback = (update) => {

  }

  postCallback = (postEventUpdate) => {
    const { dp: { util } } = this;
    const {
      // runId: postEventRunId,
      // rootId: postEventRootId,
      // NOTE: the last active root is also the `context` of the `then` callback
      // contextId,
      schedulerTraceId
    } = postEventUpdate;

    const postUpdateData = util.getPostCallbackData(postEventUpdate);
    if (!postUpdateData) {
      // NOTE: should not happen
      return;
    }

    // add edge
    /* const newEdge =  */
    this.addEventEdge(postUpdateData, schedulerTraceId);
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
  getOrAssignRootThreadId(rootId, schedulerTraceId) {
    let asyncNode = this.dp.indexes.asyncNodes.byRoot.getUnique(rootId);
    let threadId = asyncNode?.threadId;
    if (!threadId) {
      // NOTE: this can happen, if a root executed that was not connected to any previous asynchronous events
      //    (e.g. initial root, or caused by unrecorded asynchronous events)
      // this.logger.warn(`Tried to add edge from root ${fromRootId} but it did not have a threadId`);
      // return 0;
      threadId = this.newThreadId();
      if (!asyncNode) {
        asyncNode = this.dp.collections.asyncNodes.addAsyncNode(rootId, threadId, schedulerTraceId);
      }
      else {
        // [edit-after-add] make a change to `threadId` in post, leading to stale rendered data
        // should not happen
        this.logger.warn(`rootId=${rootId} did not have threadId; reassigned: ${asyncNode.threadId} -> ${threadId}`);
        asyncNode.threadId = threadId;
      }
    }
    return asyncNode.threadId;
  }

  // ###########################################################################
  // addEdge
  // ###########################################################################

  addSyncEdge(fromRootId, toRootId, edgeType) {
    // eslint-disable-next-line max-len
    this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}Edge] ${fromRootId}->${toRootId}`);
    this.addEdge(fromRootId, toRootId, edgeType);
  }

  /**
   * Add an edge between `fromRootId` and `toRootId`
   * @param {number} fromRootId 
   * @param {number} toRootId 
   */
  addEventEdge(postUpdateData, schedulerTraceId) {
    const { dp } = this;
    const {
      chainFromRootId,
      toRootId,
      preEventUpdate: { rootId: preEventRootId }
    } = postUpdateData;

    let edgeType, fromRootId;
    const isChain = !!chainFromRootId;
    if (isChain) {
      // CHAIN
      fromRootId = chainFromRootId;
      edgeType = AsyncEdgeType.Chain;
    }
    else {
      // FORK
      fromRootId = preEventRootId;
      edgeType = AsyncEdgeType.Fork;
    }

    // const previousFromThreadId = this.getOrAssignRootThreadId(fromRootId);
    // const previousToThreadId = dp.util.getAsyncRootThreadId(toRootId);
    const fromThreadId = this.getOrAssignRootThreadId(fromRootId, schedulerTraceId);
    const toThreadId = isChain ? fromThreadId : this.newThreadId();
    // let toThreadId = toRootId && this.getOrAssignRootThreadId(toRootId, schedulerTraceId) || 0;

    // this.logger.debug(`addEventEdge`, fromRootId, dp.util.getChainFrom(fromRootId));

    if (fromRootId >= toRootId) {
      this.logger.warn(`addEventEdge with fromRootId (${fromRootId}) >= toRootId (${toRootId})`);
    }

    // toRootId was not assigned to any thread yet
    dp.collections.asyncNodes.setNodeThreadId(toRootId, toThreadId, schedulerTraceId);

    // add edge
    const newEdge = this.addEdge(fromRootId, toRootId, edgeType);
    if (!newEdge) {
      return null;
    }

    // eslint-disable-next-line max-len
    // this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}] [${fromThreadId !== toThreadId ? `${fromThreadId}->` : ''}${toThreadId}] ${fromRootId}->${toRootId} (tid=${schedulerTraceId}${isNested ? `, nested` : ''})`);

    return newEdge;
  }

  addEdge(fromRootId, toRootId, edgeType) {
    const { dp } = this;
    if (!fromRootId || !toRootId) {
      this.logger.error(new Error(
        `Tried to add invalid ${AsyncEdgeType.nameFromForce(edgeType)} edge, from root ${fromRootId} to ${toRootId}`
      ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => $
      return null;
    }

    const previousEdge = dp.util.getAsyncEdgeFromTo(fromRootId, toRootId);
    if (previousEdge) {
      if (previousEdge.edgeType !== edgeType) {
        // NOTE: the same sync edge might be added repeatedly due to different events(?)
        this.logger.error(new Error(
          `Tried to add ${AsyncEdgeType.nameFromForce(edgeType)} edge, but there already was one, from ${fromRootId} to ${toRootId} - ${JSON.stringify(previousEdge)}`
        ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => ${toThreadId})`);
      }
      return null;
    }

    // if (!outEdges[fromRootId]) {
    //   outEdges[fromRootId] = new Map();
    // }
    // outEdges[fromRootId].set(toRootId, 1);

    return dp.collections.asyncEvents.addEdge(fromRootId, toRootId, edgeType);
  }
}
