import Collection from './Collection';
import pools from './pools';

class AsyncEventCollection extends Collection {
  constructor() {
    super('asyncEvents');
  }

  addEdge(fromRootContextId, toRootContextId, edgeType) {
    const event = pools.asyncEvent.allocate();

    event.asyncEventId = this._all.length;
    this.push(event);

    event.fromRootContextId = fromRootContextId;
    event.toRootContextId = toRootContextId;
    event.edgeType = edgeType;

    this._send(event);

    return event;
  }
}

const asyncEventCollection = new AsyncEventCollection();

export default asyncEventCollection;