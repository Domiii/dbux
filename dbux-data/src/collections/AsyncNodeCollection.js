import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import AsyncNode from '@dbux/common/src/types/AsyncNode';
import { newLogger } from '@dbux/common/src/log/logger';
import Collection from '../Collection';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('AsyncNodeCollection');

/**
 * TODO: should not add to `thread#1` since it could also contain valid CHAINs (e.g. top-level await)
 * NOTE: sync this with `AsyncEventUpdateCollection#_maxThreadId`
 */
const UnassignedThreadId = 1;

class ThreadLaneManager {
  constructor() {
    this.maxLaneId = 0;
    this.threadLaneByThreadId = new Map();
    this.threadLanePool = new MinPriorityQueue();
  }

  getLaneId(threadId) {
    if (this.threadLaneByThreadId.get(threadId)) {
      return this.threadLaneByThreadId.get(threadId);
    }
    else if (!this.threadLanePool.isEmpty()) {
      const threadLaneId = this.threadLanePool.dequeue().element;
      this.threadLaneByThreadId.set(threadId, threadLaneId);
      return threadLaneId;
    }
    else {
      const threadLaneId = ++this.maxLaneId;
      this.threadLaneByThreadId.set(threadId, threadLaneId);
      return threadLaneId;
    }
  }

  terminateThreadById(threadId) {
    const terminatedLaneId = this.threadLaneByThreadId.get(threadId);
    if (!terminatedLaneId) {
      logError(`Cannot terminate threadLaneId: ${terminatedLaneId}`);
    }
    this.threadLaneByThreadId.delete(threadId);
    this.threadLanePool.enqueue(terminatedLaneId);
  }
}

/**
 * @extends {Collection<AsyncNode>}
 */
export default class AsyncNodeCollection extends Collection {
  constructor(dp) {
    super('asyncNodes', dp, true);

    // NOTE: this collection is not populated by `runtime`
    this._all.push(null);
    this.threadLaneManager = new ThreadLaneManager();
  }

  _makeEntry(entries, rootId, threadId, schedulerTraceId, syncPromiseIds) {
    const entry = new AsyncNode();
    entry.asyncNodeId = entry._id = this._all.length + entries.length;
    entry.rootContextId = rootId;
    entry.threadId = threadId;
    entry.schedulerTraceId = schedulerTraceId;
    entry.syncPromiseIds = syncPromiseIds;
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

  addAsyncNode(rootId, threadId, schedulerTraceId, syncPromiseIds) {
    const entries = [];
    this._makeUnassignedNodes(entries, rootId);

    const newNode = this._makeEntry(entries, rootId, threadId, schedulerTraceId, syncPromiseIds);
    entries.push(newNode);

    this._onNewThreadId(newNode);

    this.addEntriesPostAdd(entries);

    return newNode;
  }

  setNodeThreadId(rootId, threadId, schedulerTraceId, syncPromiseIds = null) {
    const node = this.dp.util.getAsyncNode(rootId);
    if (!node) {
      return this.addAsyncNode(rootId, threadId, schedulerTraceId, syncPromiseIds);
    }

    // const report = node.threadId !== threadId ? this.logger.trace : this.logger.warn;
    // report.call(this.logger, `[setNodeThreadId] node was assigned threadId more than once - old=${node.threadId}, ` +
    //   `new=${threadId}, trace=${this.dp.util.makeTraceInfo(schedulerTraceId)}, node=`, node);
    // -> reported in `AsyncEventUpdateCollection` instead
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

  /**
   * @param {AsyncNode[]} asyncNodes 
   */
  resolveThreadLaneIds(asyncNodes) {
    for (const asyncNode of asyncNodes) {
      const { asyncNodeId, threadId } = asyncNode;
      asyncNode.threadLaneId = this.threadLaneManager.getLaneId(threadId);
      const isTerminalNode = this.dp.util.isAsyncNodeTerminalNode(asyncNodeId);
      if (isTerminalNode) {
        this.threadLaneManager.terminateThreadById(threadId);
      }
      asyncNode.isTerminalNode = isTerminalNode;
    }
  }

  postIndexProcessed(asyncNodes) {
    this.errorWrapMethod('resolveThreadLaneIds', asyncNodes);
  }
}