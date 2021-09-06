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
    const { dp } = this;
    const {
      rootId: preEventRootId,
      nestedPromiseId
    } = update;

    
    const nestedUpdate = nestedPromiseId && dp.util.getFirstPostOrResolveAsyncEventOfPromise(nestedPromiseId, preEventRootId);
    if (nestedUpdate?.rootId <= preEventRootId) {
      console.trace(`[preAwait] addSyncEdge ${preEventRootId}, nestedUpdate=`, nestedUpdate);
      this.addSyncEdge(preEventRootId, nestedUpdate.rootId, AsyncEdgeType.SyncOut);
    }
  }

  /**
   * @param {PostAwaitUpdate} postEventUpdate 
   */
  postAwait = postEventUpdate => {
    const { /* dp,  */dp: { util } } = this;

    const {
      rootId: postEventRootId,
      schedulerTraceId,
      promiseId
    } = postEventUpdate;

    /**
     * Implies that function was called by the system or some other caller that was not recorded
     */
    const isCallNotRecorded = !promiseId;

    const postUpdateData = util.getPostAwaitData(postEventUpdate);
    if (!postUpdateData) {
      // NOTE: should not happen
      return;
    }

    const {
      preEventUpdate: {
        rootId: preEventRootId
      },
      isFirstAwait,
      // isNested,
      isNestedChain,
      nestedRootId,
      isChainedToRoot
    } = postUpdateData;

    const preEventThreadId = this.getOrAssignRootThreadId(preEventRootId, schedulerTraceId);
    const nestedThreadId = nestedRootId && this.getOrAssignRootThreadId(nestedRootId, schedulerTraceId);

    let fromRootId = preEventRootId;
    let fromThreadId = preEventThreadId;
    const toRootId = postEventRootId;
    let toThreadId;

    if (!isFirstAwait) {
      // Case 1: CHAIN
      if (isNestedChain && nestedRootId) {
        // chain with nested root
        if (nestedThreadId === preEventThreadId) {
          fromRootId = nestedRootId;
          // NOTE: `fromThreadId` stays the same
          // TODO: if `fromThreadId` is different from `nestedThradId`, make this a sync instead
        }
      }
      toThreadId = fromThreadId;
    }
    else if (isNestedChain && nestedRootId) {
      // Case 2: nested promise is chained into the same thread: CHAIN
      // CHAIN with nested promise: get `fromRootId` of latest `PostThen` or `PostAwait` (before this one) of promise.
      fromRootId = nestedRootId;
      fromThreadId = nestedThreadId;
      // TODO: if `fromThreadId` is different from `nestedThradId`, make this a sync instead
      toThreadId = fromThreadId;
      // }
    }
    else if (isCallNotRecorded || isChainedToRoot) {
      // Case 3: chained to root -> CHAIN
      toThreadId = fromThreadId;
    }
    else {
      // Case 4: first await and NOT chained to root and NOT nested -> FORK
      toThreadId = 0;
    }

    if (!isNestedChain && nestedRootId) {
      // nested, but not chained -> add SYNC edge
      this.addSyncEdge(nestedRootId, toRootId, AsyncEdgeType.SyncIn);
    }

    // add edge
    /* const newEdge =  */
    this.addEventEdge(fromRootId, toRootId, fromThreadId, toThreadId, schedulerTraceId);
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
      previousPostUpdate,
      isChainedToRoot
      // isFirstAwait,
      // isNested,
      // isNestedChain,
      // nestedRootId
    } = postUpdateData;

    const preEventThreadId = this.getOrAssignRootThreadId(preEventRootId, schedulerTraceId);

    let fromRootId = preEventRootId;
    let fromThreadId = preEventThreadId;
    const toRootId = postEventRootId;
    let toThreadId = fromThreadId;

    if (previousPostUpdate) { // NOTE: similar to `!isFirstAwait`
      // Case 1: pre-then promise has its own async updates (has already encountered PostAwait or PostThen)
      fromRootId = previousPostUpdate.rootId;
      fromThreadId = toThreadId = this.getOrAssignRootThreadId(fromRootId, schedulerTraceId);
    }
    else if (isChainedToRoot) {
      // Case 2: no previous Post update but chained to root -> CHAIN
    }
    // else if (isNestedChain) { // NOTE: this case is handled by the nested promise events
    //   // CHAIN with nested promise: get `fromRootId` of latest `PostThen` or `PostAwait` (before this one) of promise.
    // }
    else {
      // Case 3: no previous Post update and NOT chained to root -> FORK
      toThreadId = 0;
    }

    // if (!isNestedChain && nestedRootId) {
    //   // nested, but not chained -> add SYNC edge
    //   this.addSyncEdge(nestedRootId, toRootId, AsyncEdgeType.SyncIn);
    // }

    // add edge
    /* const newEdge =  */
    this.addEventEdge(fromRootId, toRootId, fromThreadId, toThreadId, schedulerTraceId);

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
      rootId: postEventRootId,
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
      },
      callbackChainThreadId
    } = postUpdateData;

    const preEventThreadId = this.getOrAssignRootThreadId(preEventRootId, schedulerTraceId);

    let fromRootId = preEventRootId;
    let fromThreadId = preEventThreadId;
    const toRootId = postEventRootId;
    const toThreadId = callbackChainThreadId || 0;

    // add edge
    /* const newEdge =  */
    this.addEventEdge(fromRootId, toRootId, fromThreadId, toThreadId, schedulerTraceId);
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
  addEventEdge(fromRootId, toRootId, fromThreadId, toThreadId, schedulerTraceId) {
    const { dp } = this;
    // const previousFromThreadId = this.getOrAssignRootThreadId(fromRootId);
    // const previousToThreadId = dp.util.getAsyncRootThreadId(toRootId);

    const isFork = !toThreadId ||
      // check if this is CHAIN and fromRoot already has an out-going CHAIN
      // NOTE: this can happen, e.g. when the same promise's `then` was called multiple times.
      (fromThreadId === toThreadId && dp.util.getChainFrom(fromRootId));

    // this.logger.debug(`addEventEdge`, fromRootId, dp.util.getChainFrom(fromRootId));

    if (isFork) {
      // fork!
      toThreadId = this.newThreadId();
    }

    if (fromRootId >= toRootId) {
      this.logger.warn(`addEventEdge with fromRootId (${fromRootId}) >= toRootId (${toRootId})`);
    }

    // toRootId was not assigned to any thread yet
    dp.collections.asyncNodes.setNodeThreadId(toRootId, toThreadId, schedulerTraceId);

    // add edge
    const edgeType = fromThreadId !== toThreadId ? AsyncEdgeType.Fork : AsyncEdgeType.Chain;
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
