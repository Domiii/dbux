import { newLogger } from '@dbux/common/src/log/logger';

import Collection from './Collection';
import pools from './pools';

class AsyncNodeCollection extends Collection {
  constructor() {
    super('asyncNodes');
  }

  addAsyncNode(rootContextId, threadId) {
    const asyncNode = pools.run.allocate();

    this.push(asyncNode);

    asyncNode.threadId = threadId;
    asyncNode.rootContextId = rootContextId;

    this._send(asyncNode);

    return asyncNode;
  }
}

const runCollection = new AsyncNodeCollection();

export default runCollection;