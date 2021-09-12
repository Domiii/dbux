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
    const roots = [];
    for (let contextId = minRootId + 1; contextId < maxRootId; ++contextId) {
      const context = this.dp.collections.executionContexts.getById(contextId);
      if (context?.isVirtualRoot) {
        roots.push(contextId);
      }
    }

    // add all missing roots to "unassigned thread" (for now)
    roots.forEach(contextId =>
      entries.push(
        this._makeEntry(entries, contextId, UnassignedThreadId, 0)
      )
    );
    // return roots;
  }

  addUnassignedNodes(/* minRootId */) {
    const entries = [];
    const maxRootId = this.dp.collections.executionContexts.getLastId() + 1;
    this._makeUnassignedNodes(entries, maxRootId/* , minRootId */);

    if (entries.length) {
      this.logger.debug(`addUnassignedNodes (${entries.length}):`,
        entries.map(asyncNode => asyncNode.rootContextId).join(','));
    }

    this.addEntriesPostAdd(entries);
  }

  addAsyncNode(rootId, threadId, schedulerTraceId) {
    const entries = [];
    this._makeUnassignedNodes(entries, rootId);

    const newNode = this._makeEntry(entries, rootId, threadId, schedulerTraceId);
    entries.push(newNode);

    this._onNewThreadId(newNode);

    this.addEntriesPostAdd(entries);

    return newNode;
  }

  setNodeThreadId(rootId, threadId, schedulerTraceId) {
    const node = this.dp.util.getAsyncNode(rootId);
    if (!node) {
      return this.addAsyncNode(rootId, threadId, schedulerTraceId);
    }

    // TODO: if this happens, it probably means that the node was already added to wrong indexes etc.
    this.logger.trace(`[setNodeThreadId] node was assigned threadId more than once - old=${node.threadId}, ` +
      `new=${threadId}, trace=${this.dp.util.makeTraceInfo(schedulerTraceId)}, node=`, node);
    if (node.threadId === UnassignedThreadId) {
      // [edit-after-send]
      const old = node.threadId;
      node.threadId = threadId;
      this._onNewThreadId(node, old);
    }

    // this.notifyChanged([node]);

    // else {
    // }
    return node;
  }

  _onNewThreadId(node, old) {
    // this.logger.trace(`new thread id: old=${old}, new=${JSON.stringify(node)}, trace=${this.dp.util.makeTraceInfo(node.schedulerTraceId)}`);
  }
}