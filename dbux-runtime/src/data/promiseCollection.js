
import Collection from './Collection';
import pools from './pools';

class PromiseCollection extends Collection {
  constructor() {
    super('promises');
  }

  promise(promiseId, parentPromiseId, contextId) {
    const promise = pools.promiseData.allocate();
    promise.promiseId = promiseId;
    promise.parentPromiseId = parentPromiseId;
    promise.parentContextId = contextId;

    // console.log(promiseId, parentPromiseId, contextId);

    this._all.push(promise);
    this._send(promise);

    return promise;
  }

  updatePromiseParent(promiseId, parentPromiseId) {
    this.ensurePromiseExist(promiseId);
    this._all[promiseId].parentPromiseId = parentPromiseId;
  }

  updatePromiseContext(promiseId, contextId) {
    this.ensurePromiseExist(promiseId);
    this._all[promiseId].parentContextId = contextId;
  }

  ensurePromiseExist(promiseId) {
    while (this._all.length <= promiseId) {
      this.promise(this._all.length);
    }
  }
}

/**
 * @type {PromiseCollection}
 */
const promiseCollection = new PromiseCollection();
export default promiseCollection;