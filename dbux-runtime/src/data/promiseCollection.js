
import { newLogger } from '@dbux/common/src/log/logger';
import Collection from './Collection';
import pools from './pools';

// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError } = newLogger('dbux-runtime promiseCollection');

/** @typedef {import('./RuntimeMonitor').default} RuntimeMonitor */

// const Verbose = true;
const Verbose = false;

const debug = (...args) => Verbose && _debug(...args);

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
      logError(`shouldn't be here`);
      this.promise(this._all.length);
    }
  }
}

/**
 * @type {PromiseCollection}
 */
const promiseCollection = new PromiseCollection();
export default promiseCollection;