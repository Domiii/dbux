import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import isThenable from '@dbux/common/src/util/isThenable';
import { isFunction } from 'lodash';
import { isMonkeyPatched, monkeyPatchFunctionRaw, monkeyPatchMethodRaw } from '../util/monkeyPatchUtil';

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


// ###########################################################################
// runtime events
// ###########################################################################

/**
 * Event: New promise has been scheduled.
 */
function onThen(preEventPromise, postEventPromise) {
  // take care of new promise
  maybePatchPromise(postEventPromise);

  // TODO

  debug(`promise ${getPromiseId(preEventPromise)} has child ${getPromiseId(postEventPromise)} (then)`);
}

/**
 * Event: New promise has been settled.
 */
function onThenCallback() {
  // TODO
}

// ###########################################################################
// patchPromise
// ###########################################################################

export function maybePatchPromise(value) {
  if (PromiseInstrumentationDisabled) {
    return;
  }

  if (!isThenable(value)) {
    return;
  }

  patchThenable(value);
}

export function patchThenable(promise) {
  if (!hasRecordedPromiseData(promise)) {
    recordPromiseInit(promise);
  }

  if (isMonkeyPatched(promise.then)) {
    return;
  }

  const proto = promise.constructor?.prototype;
  if (proto && promise.then === proto.then) {
    // patch prototype
    patchPromiseMethods(proto);
  }
  else {
    // patch promise itself
    patchPromiseMethods(promise);
  }
}

// ###########################################################################
// patchThen*
// ###########################################################################

function patchThenCallback(cb) {
  if (!isFunction(cb)) {
    return cb;
  }

  const originalCb = cb;
  return function patchedPromiseCb(previousResult) {
    const result = originalCb(previousResult);

    onThenCallback(previousResult, result);

    return result;
  };
}

function patchThen(holder) {
  monkeyPatchFunctionRaw(holder, 'then',
    (preEventPromise, [successCb, failCb], originalThen) => {
      maybePatchPromise(preEventPromise);
      successCb = patchThenCallback(successCb);
      failCb = patchThenCallback(failCb);

      const postEventPromise = originalThen.call(preEventPromise, successCb, failCb);
      onThen(preEventPromise, postEventPromise);
      return postEventPromise;
    }
  );
}

function patchFinally(holder) {
  monkeyPatchFunctionRaw(holder, 'finally',
    (preEventPromise, [cb], originalFinally) => {
      maybePatchPromise(preEventPromise);
      cb = patchThenCallback(cb);

      const postEventPromise = originalFinally.call(preEventPromise, cb);
      onThen(preEventPromise, postEventPromise);
      return postEventPromise;
    }
  );
}

function patchCatch(holder) {
  /**
   * Same as `then(undefined, failCb)`
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
   */
  holder.catch = function (failCb) {
    return this.then(undefined, failCb);
  };
}


// ###########################################################################
// patchPromiseClass + prototype
// ###########################################################################

function patchPromiseMethods(holder) {
  patchThen(holder);
  patchCatch(holder);
  patchFinally(holder);
}

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

  patchPromiseMethods(BasePromiseClass.prototype);

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

  // NOTE: `OriginalPromiseClass` might not be native Promise class.
  globalThis.Promise = patchPromiseClass(OriginalPromiseClass);

  if (OriginalPromiseClass !== NativePromiseClass) {
    // NOTE: NativePromiseClass ctor is unaffected from this call
    patchPromiseClass(NativePromiseClass);
  }
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