import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import isThenable from '@dbux/common/src/util/isThenable';
import { isFunction } from 'lodash';
import { peekBCEMatchCallee } from '../data/dataUtil';
import PromiseRuntimeData from '../data/PromiseRuntimeData';
import traceCollection from '../data/traceCollection';
import valueCollection from '../data/valueCollection';
import { isMonkeyPatched, monkeyPatchFunctionRaw } from '../util/monkeyPatchUtil';

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

valueCollection.maybePatchPromise = maybePatchPromise;


// ###########################################################################
// runtime events
// ###########################################################################

/**
 * Event: New promise (`postEventPromise`) has been scheduled.
 */
function thenScheduled(thenRef) {
  RuntimeMonitorInstance._runtime.thread1.thenScheduled(thenRef);
}

/**
 * Event: Promise has been settled.
 */
function thenExecuted(thenRef, previousResult, returnValue) {
  // TODO: add `previousResult` into data flow graph

  RuntimeMonitorInstance._runtime.thread1.thenExecuted(thenRef, returnValue);
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
  if (hasRecordedPromiseData(value)) {
    return;
  }

  recordUnseenPromise(value);

  if (isMonkeyPatched(value.then)) {
    return;
  }

  patchPromise(value);
}

export function patchPromise(promise) {
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

function patchThenCallback(cb, thenRef) {
  if (!isFunction(cb)) {
    return cb;
  }

  const originalCb = cb;
  return function patchedPromiseCb(previousResult) {
    const returnValue = originalCb(previousResult);
    maybePatchPromise(returnValue);

    thenExecuted(thenRef, previousResult, returnValue);

    return returnValue;
  };
}

/**
 * 
 * @param {*} preEventPromise 
 * @param {*} originalThen 
 * @returns 
 */
function _makeThenRef(preEventPromise, patchedThen) {
  const ref = valueCollection.getRefByValue(preEventPromise);
  if (!ref) {
    // not traced!
    return null;
  }

  const bceTrace = peekBCEMatchCallee(patchedThen);
  return {
    preEventPromise,
    schedulerTraceId: bceTrace?.traceId
  };
}

function patchThen(holder) {
  monkeyPatchFunctionRaw(holder, 'then',
    (preEventPromise, [successCb, failCb], originalThen, patchedThen) => {
      const thenRef = _makeThenRef(preEventPromise, patchedThen);
      if (thenRef) { // NOTE: !!thenRef implies that this is instrumented
        maybePatchPromise(preEventPromise);
        successCb = patchThenCallback(successCb, thenRef);
        failCb = patchThenCallback(failCb, thenRef);
      }

      const postEventPromise = originalThen.call(preEventPromise, successCb, failCb);

      if (thenRef) {
        maybePatchPromise(postEventPromise);
        thenRef.postEventPromise = postEventPromise;
        thenScheduled(thenRef);
      }

      return postEventPromise;
    }
  );
}

function patchFinally(holder) {
  monkeyPatchFunctionRaw(holder, 'finally',
    (preEventPromise, [cb], originalFinally) => {
      const thenRef = _makeThenRef(preEventPromise, originalFinally);
      if (thenRef) {
        maybePatchPromise(preEventPromise);
        cb = patchThenCallback(cb, thenRef);
      }

      const postEventPromise = originalFinally.call(preEventPromise, cb);

      if (thenRef) {
        maybePatchPromise(postEventPromise);
        thenRef.postEventPromise = postEventPromise;
        thenScheduled(thenRef);
      }

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

function recordUnseenPromise(promise) {
  const currentRootId = RuntimeMonitorInstance.getCurrentVirtualRootContextId();
  setPromiseData(promise, {
    rootId: currentRootId,
    id: newPromiseId()
  });
}

/**
 * @param {*} promise 
 * @param {PromiseRuntimeData} data
 */
export function setPromiseData(promise, data) {
  const _dbux_ = getOrCreatePromiseDbuxData(promise);
  Object.assign(_dbux_, data);
}

function getOrCreatePromiseDbuxData(promise) {
  let { _dbux_ } = promise;
  if (!_dbux_) {
    Object.defineProperty(promise, '_dbux_', {
      value: _dbux_ = {}
    });
  }
  return _dbux_;
}

export function hasRecordedPromiseData(promise) {
  return !!promise._dbux_;
}

/**
 * @returns {PromiseRuntimeData}
 */
export function getPromiseData(promise) {
  return promise._dbux_ || EmptyObject;
}

export function getPromiseRootId(promise) {
  return promise._dbux_?.rootId;
}

export function getPromiseFirstEventRootId(promise) {
  return promise._dbux_?.firstEventRootId;
}

export function getPromiseLastRootId(promise) {
  return promise._dbux_?.lastRootId;
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

export function maybeSetPromiseFirstEventRootId(promise, rootId) {
  if (!getPromiseFirstEventRootId(promise)) {
    setPromiseData(promise, {
      firstEventRootId: rootId
    });
  }
}

export function pushPromisePendingRootId(promise, pendingRootId) {
  const _dbux_ = getOrCreatePromiseDbuxData(promise);
  let { pendingRootIds } = _dbux_;
  if (!pendingRootIds) {
    pendingRootIds = _dbux_.pendingRootIds = [];
  }
  pendingRootIds.push(pendingRootId);
}