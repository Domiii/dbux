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

  addAsyncNode(rootId, threadId, schedulerTraceId) {
    const entry = new AsyncNode();

    entry.asyncNodeId = this._all.length;
    entry.rootContextId = rootId;
    entry.threadId = threadId;
    entry.schedulerTraceId = schedulerTraceId;

    this.addEntryPostAdd(entry);

    return entry;
  }
}