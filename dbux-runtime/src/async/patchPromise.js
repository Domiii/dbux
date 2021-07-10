import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import isThenable from '@dbux/common/src/util/isThenable';
import { isFunction } from 'lodash';
import { monkeyPatchMethodRaw } from '../util/monkeyPatchUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError } = newLogger('patchPromise');

/** @typedef {import('../RuntimeMonitor').default} RuntimeMonitor */

// const Verbose = true;
const Verbose = false;

const debug = (...args) => Verbose && _debug(...args);

const PromiseInstrumentationDisabled = false;

/**
 * @type {RuntimeMonitor}
 */
let RuntimeMonitorInstance;

export const NativePromiseClass = (async function () { })().constructor/* globalThis.Promise */;
export const OriginalPromiseClass = Promise;

// export function isWrappedPromise(value) {
//   return value instanceof WrappedPromiseClass;
// }

export function maybePatchPromise(value) {
  if (PromiseInstrumentationDisabled) {
    return;
  }

  if (!isThenable(value)) {
    return;
  }

  patchThenable(value);
  // if (value instanceof NativePromiseClass || value instanceof OriginalPromiseClass) {
  //   // TODO?
  // }
}

// ###########################################################################
// patchPromise
// ###########################################################################

export function patchThenable(promise) {
  if (!hasRecordedPromiseData(promise)) {
    recordPromiseInit(promise);
  }


}

// ###########################################################################
// patchPromiseClass
// ###########################################################################

function patchPromiseClass(BasePromiseClass) {
  class PatchedPromise extends BasePromiseClass {
    constructor(executor) {
      const wrapExecutor = (resolve, reject) => {
        const wrapResolve = (result) => {
          resolve(result);
        };
        const wrapReject = (err) => {
          reject(err);
        };

        if (typeof executor === 'function') {
          executor(wrapResolve, wrapReject);
        }
      };

      super(wrapExecutor);

      maybePatchPromise(this);
    }
  }

  monkeyPatchMethodRaw(BasePromiseClass, 'then',
    (arr, [successCb, failCb], originalThen) => {
      maybePatchPromise(this);

      // patch `then`
      if (isFunction(successCb)) {
        successCb = function patchedSuccessCb(...args) {
          const r = successCb(...args);

          return r;
        };
      }

      if (isFunction(failCb)) {
        failCb = function patchedFailCb(...args) {
          const r = failCb(...args);
          return r;
        };
      }

      // actual then call
      let childPromise = originalThen.call(this, successCb, failCb);

      // take care of new promise
      maybePatchPromise(childPromise);

      debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (then)`);

      return childPromise;
    }
  );

  /**
   * Same as `then(undefined, failCb)`
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
   */
  BasePromiseClass.prototype.catch = function (failCb) {
    return this.then(undefined, failCb);
  };

  const originalPromiseFinally = BasePromiseClass.prototype.finally;
  BasePromiseClass.prototype.finally = function (cb) {
    maybePatchPromise(this);

    let childPromise = originalPromiseFinally.call(this, (...args) => {
      if (typeof cb !== 'function') {
        return cb;
      }

      const r = cb(...args);

      return r;
    });

    maybePatchPromise(childPromise);

    debug(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (finally)`);

    return childPromise;
  };

  return PatchedPromise;
}

// ###########################################################################
// init
// ###########################################################################

export default function initPatchPromise(_runtimeMonitorInstance) {
  RuntimeMonitorInstance = _runtimeMonitorInstance;

  if (PromiseInstrumentationDisabled) {
    return;
  }

  patchPromiseClass(NativePromiseClass);
  globalThis.Promise = patchPromiseClass(OriginalPromiseClass);
}


// ###########################################################################
// promise data
// ###########################################################################

let lastPromiseId = 0;

function newPromiseId() {
  return ++lastPromiseId;
}

function recordPromiseInit(promise) {
  const currentRootId = RuntimeMonitorInstance.getCurrentVirtualRootContextId();
  setPromiseData(promise, {
    rootId: currentRootId,
    lastRootId: currentRootId,
    id: newPromiseId()
  });
}

export function setPromiseData(promise, data) {
  let { _dbux_ } = promise;
  if (!_dbux_) {
    Object.defineProperty(promise, '_dbux_', {
      value: _dbux_ = {},
      writable: true,
      enumerable: false,
      configurable: false
    });
  }
  Object.assign(_dbux_, data);
}

export function hasRecordedPromiseData(promise) {
  return !!promise._dbux_;
}

export function getPromiseData(promise) {
  return promise._dbux_ || EmptyObject;
}

export function getPromiseRootId(promise) {
  return promise._dbux_?.rootId;
}

export function getPromiseId(promise) {
  return promise._dbux_?.id;
}

export function getPromiseOwnThreadId(promise) {
  return promise?._dbux_?.threadId;
}

export function getPromiseOwnAsyncFunctionContextId(promise) {
  return promise?._dbux_?.asyncFunctionContextId;
}

export function isNewPromise(promise, currentRootId) {
  const rootId = getPromiseRootId(promise);
  return !rootId || rootId === currentRootId;
}