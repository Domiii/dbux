import AsyncNode from '@dbux/common/src/types/AsyncNode';
import Collection from '../Collection';

/**
 * @extends {Collection<AsyncNode>}
 */
export default class AsyncNodeCollection extends Collection {
  constructor(dp) {
    super('asyncNodes', dp);
  }

  addAsyncNode(rootId, threadId, schedulerTraceId) {
    const entry = new AsyncNode();
    entry.rootContextId = rootId;
    entry.threadId = threadId;
    entry.schedulerTraceId = schedulerTraceId;

    this.addEntryPostAdd(entry);

    return entry;
  }
}