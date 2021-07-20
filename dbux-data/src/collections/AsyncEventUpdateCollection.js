import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import AsyncEventUpdateType, { isAwaitEvent } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import AsyncEventUpdate, { PostAwaitUpdate } from '@dbux/common/src/types/AsyncEventUpdate';
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

  /**
   * Pre-process updates to collect data used for indexes (and `postIndexRaw`) later.
   */
  postAddRaw(updates) {
    const { dp } = this;

    for (const update of updates) {
      // const bceTrace = dp.util.getOwnCallerTraceOfContext(realContextId);
      if (isAwaitEvent(update.type)) {
        // async function
        const { realContextId } = update;
        update.promiseId = dp.util.getReturnValueRefOfContext(realContextId)?.refId;   // returnPromiseId
        if (!update.promiseId) {
          // should never happen!
          this.logger.warn(`postAddRaw [${AsyncEventUpdateType.nameFromForce(update.type)}] "getReturnValueRefOfContext" failed:`, update);
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

  }

  /**
   * @param {PostAwaitUpdate} update 
   */
  postAwait = update => {
    const { dp } = this;

    const {
      rootId: postEventRootId,
      runId: postEventRunId,
      // realContextId,
      schedulerTraceId,
      promiseId
    } = update;

    const preEventUpdate = dp.util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      this.logger.warn(`[postAwait] "getPreEventUpdate" failed:`, { promiseId }, update);
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
    const firstNestingAsyncUpdate = nestedPromiseId && this.getFirstNestingAsyncUpdate(preEventRunId, nestedPromiseId);
    const firstNestingTraceId = firstNestingAsyncUpdate.schedulerTraceId;
    const isNestedChain = firstNestingTraceId === schedulerTraceId;

    let fromRootId = preEventRootId;
    let fromThreadId = preEventThreadId;
    const toRootId = postEventRootId;
    let toThreadId = fromThreadId;

    if (!isFirstAwait || this.isPromiseChainedToRoot(preEventRunId, promiseId)) {
      // Case 1: (1.a) not first await OR (1.b) chained to root -> CHAIN
    }
    else if (isNested) {
      const nestedRootId = dp.util.getLastPostAsyncEventUpdateOfPromiseBeforeRun(promiseId, postEventRunId);
      if (isNestedChain) {
        // Case 2: nested promise is chained into the same thread: add single edge
        // CHAIN with nested promise: get `fromRootId` of latest `PostThen` or `PostAwait` (before this one) of promise.
        fromRootId = nestedRootId || preEventRootId;   // in case the promise had no Post event.
        fromThreadId = this.dp.util.getAsyncRootThreadId(fromRootId);
      }
      else {
        // Case 3: nested, but not chained -> add SYNC edge
        this.addSyncEdge(nestedRootId, toRootId, AsyncEdgeType.SyncIn);

        // add edge from previous event, as usual
      }
    }
    else {
      // first await, and NOT chained by caller and NOT chained to root -> FORK
      toThreadId = 0;
    }


    // if (isNested) {
    //   // TODO: complex nested syncs
    //   // add SYNC edge for more waiting callers
    //   const { pendingRootIds } = nestedPromiseData;
    //   if (pendingRootIds && isFirstAwait) {
    //     for (const pendingRootId of pendingRootIds) {
    //       this.addSyncEdge(pendingRootId, toRootId, AsyncEdgeType.SyncIn);
    //     }
    //   }
    // }
    // else {
    //   // assign run <-> threadId
    //   // NOTE: this should probably not happen
    //   let fromRootIdThreadId = getRunThreadId(fromRootId);
    //   if (!fromRootIdThreadId) {
    //     // this.logger.debug("From run", fromRootId, "is a new run, assign thread id");
    //     fromRootIdThreadId = this.assignRunNewThreadId(fromRootId);
    //   }
    // }

    // add edge
    /* const newEdge =  */this.addEventEdge(fromRootId, toRootId, fromThreadId, toThreadId, schedulerTraceId, isNested);
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
    let threadId = this.dp.util.getAsyncRootThreadId(rootId);
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
  addEventEdge(fromRootId, toRootId, fromThreadId, toThreadId, schedulerTraceId, isNested) {
    const { dp } = this;
    // const previousFromThreadId = this.getOrAssignRootThreadId(fromRootId);
    const previousToThreadId = dp.util.getAsyncRootThreadId(toRootId);

    const isFork = !toThreadId ||
      // check if this is CHAIN and fromRoot already has an out-going CHAIN
      // NOTE: this can happen, e.g. when the same promise's `then` was called multiple times.
      (fromThreadId === toThreadId && dp.util.getAsyncRootThreadId(fromRootId));

    if (isFork) {
      // fork!
      toThreadId = this.newThreadId();
    }

    if (!previousToThreadId) {
      // toRootId was not assigned to any thread yet
      this.dp.collections.asyncNodes.addAsyncNode(toRootId, toThreadId, schedulerTraceId);
    }

    // add edge
    const edgeType = fromThreadId !== toThreadId ? AsyncEdgeType.Fork : AsyncEdgeType.Chain;
    const newEdge = this.addEdge(fromRootId, toRootId, edgeType);
    if (!newEdge) {
      return null;
    }

    // eslint-disable-next-line max-len
    this.logger.debug(`[add${AsyncEdgeType.nameFromForce(edgeType)}] [${fromThreadId !== toThreadId ? `${fromThreadId}->` : ''}${toThreadId}] Roots: ${fromRootId}->${toRootId} (tid=${schedulerTraceId}${isNested ? `, nested` : ''})`);

    return newEdge;
  }

  addEdge(fromRootId, toRootId, edgeType) {
    if (!fromRootId || !toRootId) {
      this.logger.error(new Error(
        `Tried to add invalid ${AsyncEdgeType.nameFromForce(edgeType)} edge, from root ${fromRootId} to ${toRootId}`
      ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => $
      return null;
    }

    if (this.hasEdgeFromTo(fromRootId, toRootId)) {
      this.logger.error(new Error(
        `Tried to add ${AsyncEdgeType.nameFromForce(edgeType)} edge, but there already was one, from ${fromRootId} to ${toRootId}`
      ).stack); // (t = ${previousFromThreadId} => ${fromThreadId}) to ${toRootId} (t = ${previousToThreadId} => ${toThreadId})`);
      return null;
    }

    // if (!outEdges[fromRootId]) {
    //   outEdges[fromRootId] = new Map();
    // }
    // outEdges[fromRootId].set(toRootId, 1);

    const { dp } = this;
    return dp.collections.asyncEventCollection.addEdge(fromRootId, toRootId, edgeType);
  }
}
