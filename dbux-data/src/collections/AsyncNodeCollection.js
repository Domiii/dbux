import AsyncNode from '@dbux/common/src/types/AsyncNode';
import Collection from '../Collection';

/**
 * TODO: should not add to `thread#1` since it could also contain valid CHAINs (e.g. top-level await)
 * NOTE: sync this with `AsyncEventUpdateCollection#_maxThreadId`
 */
const UnassignedThreadId = 1;

/**
 * @extends {Collection<AsyncNode>}
 */
export default class AsyncNodeCollection extends Collection {
  constructor(dp) {
    super('asyncNodes', dp, true);

    // NOTE: this collection is not populated by `runtime`
    this._all.push(null);
  }

  _makeEntry(entries, rootId, threadId, schedulerTraceId) {
    const entry = new AsyncNode();
    entry.asyncNodeId = entry._id = this._all.length + entries.length;
    entry.rootContextId = rootId;
    entry.threadId = threadId;
    entry.schedulerTraceId = schedulerTraceId;
    entry.applicationId = this.dp.application.applicationId;
    return entry;
  }

  _makeUnassignedNodes(entries, maxRootId/* , minRootId = this.getLast()?.rootContextId || 0 */) {
    const minRootId = this.getLast()?.rootContextId || 0;
    for (let contextId = minRootId + 1; contextId < maxRootId; ++contextId) {
      const context = this.dp.collections.executionContexts.getById(contextId);
      if (context?.isVirtualRoot) {
        // add all missing roots to "unassigned thread" (for now)
        entries.push(this._makeEntry(entries, contextId, UnassignedThreadId, 0));
      }
    }
  }

  addUnassignedNodes(/* minRootId */) {
    const entries = [];
    const maxRootId = this.dp.collections.executionContexts.getLastId() + 1;
    this._makeUnassignedNodes(entries, maxRootId/* , minRootId */);
    this.addEntriesPostAdd(entries);
  }

  addAsyncNode(rootId, threadId, schedulerTraceId) {
    const entries = [];
    this._makeUnassignedNodes(entries, rootId);

    const newNode = this._makeEntry(entries, rootId, threadId, schedulerTraceId);
    entries.push(newNode);

    this.addEntriesPostAdd(entries);

    return newNode;
  }

  setNodeThreadId(rootId, threadId, schedulerTraceId) {
    // [edit-after-send]
    const node = this.dp.util.getAsyncNode(rootId);
    if (!node) {
      return this.addAsyncNode(rootId, threadId, schedulerTraceId);
    }

    this.logger.warn(`node was assigned threadId more than once - old=${node.threadId}, ` +
      `new=${threadId}, trace=${this.dp.util.makeTraceInfo(schedulerTraceId)}, node=`, node);
    if (node.threadId === UnassignedThreadId) {
      node.threadId = threadId;
    }
    // else {
    // }
    return node;
  }
}