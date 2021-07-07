import Collection from './Collection';
import pools from './pools';

class AsyncEventCollection extends Collection {
  constructor() {
    super('asyncEvents');
  }

  addEdge(fromRun, toRun, edgeType) {
    const event = pools.asyncEvent.allocate();

    event.asyncEventId = this._all.length;
    this.push(event);

    event.fromRun = fromRun;
    event.toRun = toRun;
    event.edgeType = edgeType;

    this._send(event);

    return event;
  }
}

const asyncEventCollection = new AsyncEventCollection();

export default asyncEventCollection;