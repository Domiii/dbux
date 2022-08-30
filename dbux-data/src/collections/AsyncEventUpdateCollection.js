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

        // hackfix: fix up promiseId (especially for first PreAwait)
        update.promiseId = update.promiseId || 
          dp.util.getCallValueRefOfContext(realContextId)?.refId ||
          dp.util.getAsyncFunctionCallerPromiseId(realContextId);

        if (!update.promiseId) {
          // can sometimes happen
          this.logger.warn(`postAdd [${AsyncEventUpdateType.nameFromForce(update.type)}] "promiseId" not found:`, update);
        }
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
    
    this.getOrAssignRootThreadId(preEventRootId);
    rootIdNested && this.getOrAssignRootThreadId(rootIdNested, schedulerTraceId);

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
      // rootId: postEventRootId,
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
      rootIdUp,
      rootIdDown
    } = postUpdateData;

    this.getOrAssignRootThreadId(preEventRootId);
    rootIdUp && this.getOrAssignRootThreadId(rootIdUp, schedulerTraceId);
    rootIdDown && this.getOrAssignRootThreadId(rootIdDown, schedulerTraceId);

    // add edge
    /* const newEdge =  */
    this.addEventEdge(postUpdateData, schedulerTraceId);
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

    const {
      preEventUpdate: {
        rootId: preEventRootId
      }
    } = postUpdateData;

    this.getOrAssignRootThreadId(preEventRootId);

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
    if (!rootId) {
      this.logger.trace(`[getOrAssignRootThreadId] no rootId given, trace: ${this.dp.util.makeTraceInfo(schedulerTraceId)}`);
      return 0;
    }
    if (Array.isArray(rootId)) {
      return rootId.map(r => this.getOrAssignRootThreadId(r, schedulerTraceId));
    }
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

    let fromRootId;
    let isChain = !!chainFromRootId;
    if (isChain) {
      // CHAIN
      fromRootId = chainFromRootId;
    }
    else {
      // FORK
      fromRootId = preEventRootId;
    }

    // // only one out-going CHAIN per root
    // isChain = isChain && !dp.indexes.asyncEvents.from.hasAny(chainFromRootId);

    // const previousFromThreadId = this.getOrAssignRootThreadId(fromRootId);
    // const previousToThreadId = dp.util.getAsyncRootThreadId(toRootId);
    const fromThreadId = this.getOrAssignRootThreadId(fromRootId, schedulerTraceId);
    let toThreadId;

    if (fromRootId === toRootId) {
      this.logger.warn(`Prevented loop edge from = to = ${fromRootId}`);
      return;
    }

    toThreadId = isChain ? fromThreadId : this.newThreadId();

    if (Array.isArray(toThreadId)) {
      // NOTE: `toThreadId` should only be a singular threadId, even if `from` is multiple?
      // eslint-disable-next-line prefer-destructuring
      toThreadId = toThreadId[0];
    }

    const oldToThreadId = dp.util.getAsyncRootThreadId(toRootId);
    if (oldToThreadId) {
      // toRootId was previously assigned a thread id already -> should not happen
      // if (!isChain || oldToThreadId !== fromThreadId) {
      // TODO: if this happens, it usually means, a node has multiple `Post*` updates
      //    -> previous analysis: caused by `PostCallback`, where multiple callbacks were triggered in the same root
      //        -> should be fixed (by not adding `AsyncNode` if callback is not root)
      //    -> maybe was already added to wrong indexes
      // eslint-disable-next-line max-len
      this.logger.warn(`Tried to overwrite toThreadId - schedulerTraceId=${schedulerTraceId}, newTo=${toThreadId}, oldTo=${oldToThreadId}, from=${fromThreadId}, fromRoot=${fromRootId}, toRoot=${toRootId}, chain=${isChain}, postUpdateData=${JSON.stringify(postUpdateData)}, stack=${new Error().stack}`);
      // }
      // isChain = oldToThreadId === fromThreadId;
      // toThreadId = oldToThreadId;
    }

    dp.collections.asyncNodes.setNodeThreadId(toRootId, toThreadId, schedulerTraceId, postUpdateData.syncPromiseIds);

    // let toThreadId = toRootId && this.getOrAssignRootThreadId(toRootId, schedulerTraceId) || 0;

    // this.logger.debug(`addEventEdge`, fromRootId, dp.util.getChainFrom(fromRootId));

    // add edge
    const edgeType = isChain ? AsyncEdgeType.Chain : AsyncEdgeType.Fork;
    /* const newEdge =  */
    this._addEventEdges(fromRootId, toRootId, edgeType);
    // if (!newEdge) {
    //   return null;
    // }

    // // eslint-disable-next-line max-len
    // // this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}] [${fromThreadId !== toThreadId ? `${fromThreadId}->` : ''}${toThreadId}] ${fromRootId}->${toRootId} (tid=${schedulerTraceId}${isNested ? `, nested` : ''})`);

    // return newEdge;
  }
  
  _addEventEdges(fromRootId, toRootId, edgeType, syncPromiseIds) {
    if (Array.isArray(fromRootId)) {
      return fromRootId.map(from => this._addEventEdges(from, toRootId, edgeType));
    }
    else {
      if (fromRootId >= toRootId) {
        this.logger.warn(`addEventEdge with fromRootId (${fromRootId}) >= toRootId (${toRootId})`);
      }
      return this.addEdge(fromRootId, toRootId, edgeType, syncPromiseIds);
    }
  }

  addEdge(fromRootId, toRootId, edgeType, syncPromiseIds) {
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

    return dp.collections.asyncEvents.addEdge(fromRootId, toRootId, edgeType, syncPromiseIds);
  }
}
