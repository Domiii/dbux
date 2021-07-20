import AsyncEvent from '@dbux/common/src/types/AsyncEvent';
import Collection from '../Collection';

/**
 * @extends {Collection<AsyncEvent>}
 */
export default class AsyncEventCollection extends Collection {
  constructor(dp) {
    super('asyncEvents', dp);
  }

  addEdge(fromRootContextId, toRootContextId, edgeType) {
    const entry = new AsyncEvent();

    entry.asyncEventId = this._all.length;
    entry.fromRootContextId = fromRootContextId;
    entry.toRootContextId = toRootContextId;
    entry.edgeType = edgeType;

    this.addEntryPostAdd(entry);

    return entry;
  }
}