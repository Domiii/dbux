import Collection from './Collection';
import pools from './pools';

class AsyncNodeCollection extends Collection {
  constructor() {
    super('asyncNodes');
  }

  // addAsyncNode(rootContextId, threadId, traceId) {
  //   const asyncNode = pools.asyncNodes.allocate();

  //   asyncNode.asyncNodeId = this._all.length;
  //   this.push(asyncNode);

  //   asyncNode.rootContextId = rootContextId;
  //   asyncNode.threadId = threadId;
  //   asyncNode.schedulerTraceId = traceId;

  //   this._send(asyncNode);

  //   return asyncNode;
  // }
}

const asyncNodeCollection = new AsyncNodeCollection();

export default asyncNodeCollection;