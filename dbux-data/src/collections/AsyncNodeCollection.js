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

  _makeMissingEntries(entries, maxRootId) {
    const previous = this.getLast();
    for (let contextId = (previous?.rootContextId || 0) + 1; contextId < maxRootId; ++contextId) {
      const context = this.dp.collections.executionContexts.getById(contextId);
      if (context?.isVirtualRoot) {
        // add all missing roots to "unassigned thread" (for now)
        entries.push(this._makeEntry(entries, contextId, UnassignedThreadId, 0));
      }
    }
  }

  addMissingEntries() {
    const entries = [];
    this._makeMissingEntries(entries, this.dp.collections.executionContexts.getLastId() + 1);
    this.addEntriesPostAdd(entries);
  }

  addAsyncNode(rootId, threadId, schedulerTraceId) {
    const entries = [];
    this._makeMissingEntries(entries, rootId);

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

    if (node.threadId === UnassignedThreadId) {
      node.threadId = threadId;
    }
    else {
      this.logger.warn(`node was assigned threadId more than once old=${node.threadId}, ` +
        `new=${threadId}, trace=${this.dp.util.makeTraceInfo(schedulerTraceId)}, node=`, node);
    }
    return node;
  }
}