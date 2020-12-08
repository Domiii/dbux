/* eslint-disable prefer-promise-reject-errors */

import { newLogger } from '@dbux/common/src/log/logger';
import RuntimeMonitor from './RuntimeMonitor';

// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError } = newLogger('wrapPromise');

// const Verbose = true;
const Verbose = false;

const debug = (...args) => Verbose && _debug(...args);

export default function wrapPromise() {
  let promiseId = 1;
  const promiseSet = new Set();

  const originalPromise = globalThis.Promise;

  globalThis.Promise = class Promise extends originalPromise {
    constructor(executor) {
      let thisPromiseId = promiseId++;

      const wrapExecutor = (resolve, reject) => {
        const wrapResolve = (result) => {
          resolve(result);
        };
        const wrapReject = (err) => {
          reject(err);
        };

        if (typeof executor === 'function') {
          executor?.(wrapResolve, wrapReject);
          RuntimeMonitor.instance.tryUpdateLastContextPromiseId(thisPromiseId);
        }
      };

      RuntimeMonitor.instance.promise(thisPromiseId);

      super(wrapExecutor);
      this.promiseId = thisPromiseId;
      promiseSet.add(this);
    }

    then(successCb, failCb) {
      let childPromise = super.then((result) => {
        if (typeof successCb === 'function') {
          const returnValue = successCb(result);

          RuntimeMonitor.instance.tryUpdateLastContextPromiseId(childPromise.promiseId);
          return returnValue;
        }
      }, (err) => {
        if (typeof failCb === 'function') {
          const returnValue = failCb(err);

          RuntimeMonitor.instance.tryUpdateLastContextPromiseId(childPromise.promiseId);
          return returnValue;
        }
      });

      debug(`Promise ${this.promiseId} has child promise ${childPromise.promiseId} (then)`);
      RuntimeMonitor.instance.updatePromiseParent(childPromise.promiseId, this.promiseId);
      return childPromise;
    }

    catch(failCb) {
      return this.then(null, failCb);
    }

    finally(cb) {
      let childPromise = super.finally(() => {
        cb();
        RuntimeMonitor.instance.tryUpdateLastContextPromiseId(childPromise.promiseId);
      });

      debug(`Promise ${this.promiseId} has child promise ${childPromise.promiseId} (finally)`);
      return childPromise;
    }
  };

  const originalPromiseThen = originalPromise.prototype.then;
  originalPromise.prototype.then = function (successCb, failCb) {
    if (!promiseSet.has(this)) {
      promiseSet.add(this);
      this.promiseId = promiseId++;
      RuntimeMonitor.instance.promise(this.promiseId);
    }

    let childPromise = originalPromiseThen.call(this, successCb, failCb);
    // TODO: maybe need to update promise's context id here
    promiseSet.add(childPromise);
    if (childPromise.promiseId === undefined) {
      childPromise.promiseId = promiseId++;
      RuntimeMonitor.instance.promise(childPromise.promiseId);
    }

    debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (then)`);

    RuntimeMonitor.instance.updatePromiseParent(childPromise.promiseId, this.promiseId);
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
      this.promiseId = promiseId++;
      RuntimeMonitor.instance.promise(this.promiseId);
    }

    let childPromise = originalPromiseFinally.call(this, cb);
    // TODO: maybe need to update promise's context id here
    promiseSet.add(childPromise);
    if (childPromise.promiseId === undefined) {
      childPromise.promiseId = promiseId++;
      RuntimeMonitor.instance.promise(childPromise.promiseId);
    }

    debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (finally)`);

    RuntimeMonitor.instance.updatePromiseParent(childPromise.promiseId, this.promiseId);
    return childPromise;
  };
}