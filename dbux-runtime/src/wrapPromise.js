
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError } = newLogger('wrapPromise');

/** @typedef {import('./RuntimeMonitor').default} RuntimeMonitor */

// const Verbose = true;
const Verbose = false;

const debug = (...args) => Verbose && _debug(...args);

const disable = true;

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
        // runtimeMonitor.promise(promise.promiseId);
      }
    } 
    else {
      promiseSet.add(promise);
      if (promise.promiseId) {
        logError('Exist a promise with promise id but not in promise set.');
      }
      else {
        promise.promiseId = getNewPromiseId();
        // runtimeMonitor.promise(promise.promiseId);
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
          const beforeExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
          
          executor?.(wrapResolve, wrapReject);

          const afterExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
          if (beforeExecutorLastContextId !== afterExecutorLastContextId) {
            runtimeMonitor.updateExecutionContextPromiseId(beforeExecutorLastContextId + 1, thisPromiseId);
          }
        }
      };

      // runtimeMonitor.promise(thisPromiseId);

      super(wrapExecutor);
      this.promiseId = thisPromiseId;
      promiseSet.add(this);
    }

    then(successCb, failCb) {
      let childPromise = super.then((result) => {
        if (typeof successCb === 'function') {
          const beforeExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();

          const returnValue = successCb(result);

          const afterExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
          debug('before after @ then', beforeExecutorLastContextId, afterExecutorLastContextId);
          if (beforeExecutorLastContextId !== afterExecutorLastContextId) {
            runtimeMonitor.updateExecutionContextPromiseId(beforeExecutorLastContextId + 1, childPromise.promiseId);
          }

          return returnValue;
        }
      }, (err) => {
        if (typeof failCb === 'function') {
          const beforeExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
          
          const returnValue = failCb(err);

          const afterExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
          if (beforeExecutorLastContextId !== afterExecutorLastContextId) {
            runtimeMonitor.updateExecutionContextPromiseId(beforeExecutorLastContextId + 1, childPromise.promiseId);
          }

          return returnValue;
        }
      });

      debug(`Promise ${this.promiseId} has child promise ${childPromise.promiseId} (then)`);
      // runtimeMonitor.updatePromiseParent(childPromise.promiseId, this.promiseId);
      return childPromise;
    }

    catch(failCb) {
      return this.then(null, failCb);
    }

    finally(cb) {
      let childPromise = super.finally(() => {
        const beforeExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
          
        cb();

        const afterExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
        if (beforeExecutorLastContextId !== afterExecutorLastContextId) {
          runtimeMonitor.updateExecutionContextPromiseId(beforeExecutorLastContextId + 1, childPromise.promiseId);
        }
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
      // runtimeMonitor.promise(this.promiseId);
    }

    let childPromise = originalPromiseThen.call(this, (...args) => {
      if (typeof successCb !== 'function') {
        return successCb;
      }
      const beforeExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();

      const r = successCb(...args);

      const afterExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
      if (beforeExecutorLastContextId !== afterExecutorLastContextId) {
        runtimeMonitor.updateExecutionContextPromiseId(beforeExecutorLastContextId + 1, childPromise.promiseId);
      }

      return r;
    }, (...args) => {
      if (typeof failCb !== 'function') {
        return failCb;
      }

      const beforeExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();

      const r = failCb(...args);

      const afterExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
      if (beforeExecutorLastContextId !== afterExecutorLastContextId) {
        runtimeMonitor.updateExecutionContextPromiseId(beforeExecutorLastContextId + 1, childPromise.promiseId);
      }

      return r;
    });

    promiseSet.add(childPromise);
    if (childPromise.promiseId === undefined) {
      childPromise.promiseId = getNewPromiseId();
      // runtimeMonitor.promise(childPromise.promiseId);
    }

    debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (then)`);

    // runtimeMonitor.updatePromiseParent(childPromise.promiseId, this.promiseId);
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
      // runtimeMonitor.promise(this.promiseId);
    }

    let childPromise = originalPromiseFinally.call(this, (...args) => {
      if (typeof cb !== 'function') {
        return cb;
      }
      const beforeExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();

      const r = cb(...args);

      const afterExecutorLastContextId = runtimeMonitor.getLastExecutionContextId();
      if (beforeExecutorLastContextId !== afterExecutorLastContextId) {
        runtimeMonitor.updateExecutionContextPromiseId(beforeExecutorLastContextId + 1, childPromise.promiseId);
      }

      return r;
    });

    promiseSet.add(childPromise);
    if (childPromise.promiseId === undefined) {
      childPromise.promiseId = getNewPromiseId();
      // runtimeMonitor.promise(childPromise.promiseId);
    }

    debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (finally)`);

    // runtimeMonitor.updatePromiseParent(childPromise.promiseId, this.promiseId);
    return childPromise;
  };
}