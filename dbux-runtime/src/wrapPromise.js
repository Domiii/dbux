
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError } = newLogger('wrapPromise');

/** @typedef {import('./RuntimeMonitor').default} RuntimeMonitor */

// const Verbose = true;
const Verbose = false;

const debug = (...args) => Verbose && _debug(...args);

const disable = false;

/**
 * @type {RuntimeMonitor}
 */
let runtimeMonitor;

export const originalPromise = globalThis.Promise;

let promiseId = 0;
const promiseSet = new Set();

export function getNewPromiseId() {
  return ++promiseId;
}

export function ensurePromiseWrapped(promise) {
  // if (disable) {
  //   return;
  // }

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

  if (disable) {
    return;
  }

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
        }
      };

      super(wrapExecutor);
      this.promiseId = thisPromiseId;
      // this._dbux_threadId = this.runtimeMonitor._runtime.thread1.
      promiseSet.add(this);
    }

    then(successCb, failCb) {
      let childPromise = super.then((result) => {
        if (typeof successCb === 'function') {
          const returnValue = successCb(result);

          return returnValue;
        }
      }, (err) => {
        if (typeof failCb === 'function') {
          const returnValue = failCb(err);
          return returnValue;
        }
      });

      debug(`Promise ${this.promiseId} has child promise ${childPromise.promiseId} (then)`);
      return childPromise;
    }

    catch(failCb) {
      return this.then(null, failCb);
    }

    finally(cb) {
      let childPromise = super.finally(() => {
        cb();
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
    }

    let childPromise = originalPromiseThen.call(this, (...args) => {
      if (typeof successCb !== 'function') {
        return successCb;
      }

      const r = successCb(...args);

      return r;
    }, (...args) => {
      if (typeof failCb !== 'function') {
        return failCb;
      }

      const r = failCb(...args);

      return r;
    });

    promiseSet.add(childPromise);
    if (childPromise.promiseId === undefined) {
      childPromise.promiseId = getNewPromiseId();
    }

    debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (then)`);

    return childPromise;
  };

  const originalPromiseCatch = originalPromise.prototype.catch;
  originalPromise.prototype.catch = function (failCb) {
    return originalPromiseCatch.call(this, failCb);
  };

  const originalPromiseFinally = originalPromise.prototype.finally;
  originalPromise.prototype.finally = function (cb) {
    if (!promiseSet.has(this)) {
      promiseSet.add(this);
      this.promiseId = getNewPromiseId();
    }

    let childPromise = originalPromiseFinally.call(this, (...args) => {
      if (typeof cb !== 'function') {
        return cb;
      }

      const r = cb(...args);

      return r;
    });

    promiseSet.add(childPromise);
    if (childPromise.promiseId === undefined) {
      childPromise.promiseId = getNewPromiseId();
    }

    debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (finally)`);

    return childPromise;
  };
}