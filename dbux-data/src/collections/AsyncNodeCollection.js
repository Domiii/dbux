import AsyncNode from '@dbux/common/src/types/AsyncNode';
import Collection from '../Collection';

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
    // add all missing roots to thread#1 (for now)
    for (let contextId = (previous?.rootContextId || 0) + 1; contextId < maxRootId; ++contextId) {
      const context = this.dp.collections.executionContexts.getById(contextId);
      if (context?.isVirtualRoot) {
        entries.push(this._makeEntry(entries, contextId, 1, 0));
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
}