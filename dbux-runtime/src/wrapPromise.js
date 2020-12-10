
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError } = newLogger('wrapPromise');

// const Verbose = true;
const Verbose = false;

const debug = (...args) => Verbose && _debug(...args);

let runtimeMonitor;

export const originalPromise = globalThis.Promise;

let promiseId = 1;
const promiseSet = new Set();

export function getNewPromiseId() {
  return promiseId++;
}

export function ensurePromiseWrapped(promise) {
  if (promise instanceof originalPromise) {
    if (promiseSet.has(promise)) {
      if (promise.promiseId === undefined) {
        logError('Exist a promise in promise set but without promise id.');
        promise.promiseId = getNewPromiseId();
      }
    } 
    else {
      promiseSet.add(promise);
      if (promise.promiseId) {
        logError('Exist a promise with promise id but not in promise set.');
      }
      else {
        promise.promiseId = getNewPromiseId();
      }
    }
  }
}

export default function wrapPromise(_runtimeMonitor) {
  runtimeMonitor = _runtimeMonitor;
  globalThis.Promise = class Promise extends originalPromise {
    constructor(executor) {
      let thisPromiseId = getNewPromiseId();

      const wrapExecutor = (resolve, reject) => {
        const wrapResolve = (result) => {
          resolve(result);
        };
        const wrapReject = (err) => {
          reject(err);
        };

        if (typeof executor === 'function') {
          executor?.(wrapResolve, wrapReject);
          runtimeMonitor.tryUpdateLastContextPromiseId(thisPromiseId);
        }
      };

      runtimeMonitor.promise(thisPromiseId);

      super(wrapExecutor);
      this.promiseId = thisPromiseId;
      promiseSet.add(this);
    }

    then(successCb, failCb) {
      let childPromise = super.then((result) => {
        if (typeof successCb === 'function') {
          const returnValue = successCb(result);

          runtimeMonitor.tryUpdateLastContextPromiseId(childPromise.promiseId);
          return returnValue;
        }
      }, (err) => {
        if (typeof failCb === 'function') {
          const returnValue = failCb(err);

          runtimeMonitor.tryUpdateLastContextPromiseId(childPromise.promiseId);
          return returnValue;
        }
      });

      debug(`Promise ${this.promiseId} has child promise ${childPromise.promiseId} (then)`);
      runtimeMonitor.updatePromiseParent(childPromise.promiseId, this.promiseId);
      return childPromise;
    }

    catch(failCb) {
      return this.then(null, failCb);
    }

    finally(cb) {
      let childPromise = super.finally(() => {
        cb();
        runtimeMonitor.tryUpdateLastContextPromiseId(childPromise.promiseId);
      });

      debug(`Promise ${this.promiseId} has child promise ${childPromise.promiseId} (finally)`);
      return childPromise;
    }
  };

  const originalPromiseThen = originalPromise.prototype.then;
  originalPromise.prototype.then = function (successCb, failCb) {
    if (!promiseSet.has(this)) {
      promiseSet.add(this);
      this.promiseId = getNewPromiseId();
      runtimeMonitor.promise(this.promiseId);
    }

    let childPromise = originalPromiseThen.call(this, successCb, failCb);
    // TODO: maybe need to update promise's context id here
    promiseSet.add(childPromise);
    if (childPromise.promiseId === undefined) {
      childPromise.promiseId = getNewPromiseId();
      runtimeMonitor.promise(childPromise.promiseId);
    }

    debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (then)`);

    runtimeMonitor.updatePromiseParent(childPromise.promiseId, this.promiseId);
    return childPromise;
  };

  const originalPromiseCatch = originalPromise.prototype.catch;
  originalPromise.prototype.catch = function (failCb) {
    return this.then(null, failCb);
  };

  const originalPromiseFinally = originalPromise.prototype.finally;
  originalPromise.prototype.finally = function (cb) {
    if (!promiseSet.has(this)) {
      promiseSet.add(this);
      this.promiseId = getNewPromiseId();
      runtimeMonitor.promise(this.promiseId);
    }

    let childPromise = originalPromiseFinally.call(this, cb);
    // TODO: maybe need to update promise's context id here
    promiseSet.add(childPromise);
    if (childPromise.promiseId === undefined) {
      childPromise.promiseId = getNewPromiseId();
      runtimeMonitor.promise(childPromise.promiseId);
    }

    debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (finally)`);

    runtimeMonitor.updatePromiseParent(childPromise.promiseId, this.promiseId);
    return childPromise;
  };
}