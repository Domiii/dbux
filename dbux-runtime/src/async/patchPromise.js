import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import isThenable from '@dbux/common/src/util/isThenable';
import { isFunction } from 'lodash';
import dataNodeCollection from '../data/dataNodeCollection';
import { peekBCEMatchCallee } from '../data/dataUtil';
import PromiseRuntimeData from '../data/PromiseRuntimeData';
// import traceCollection from '../data/traceCollection';
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
  RuntimeMonitorInstance._runtime.async.preThen(thenRef);
}

/**
 * Event: Promise has been settled.
 */
function thenExecuted(thenRef, previousResult, returnValue) {
  // TODO: add `previousResult` into data flow graph

  RuntimeMonitorInstance._runtime.async.postThen(thenRef, returnValue);
}

// ###########################################################################
// patchPromise
// ###########################################################################

export function maybePatchPromise(value) {
  if (PromiseInstrumentationDisabled) {
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

let activeThenCbCount = 0;
function patchThenCallback(thenCb, thenRef) {
  if (!isFunction(thenCb)) {
    return thenCb;
  }

  const originalThenCb = thenCb;
  return function patchedPromiseCb(previousResult) {
    if (activeThenCbCount) {
      warn(`then callback called before previous then callback has finished, schedulerTraceId=${thenRef.schedulerTraceId}`);
    }
    ++activeThenCbCount;

    let returnValue;
    try {
      try {
        // actually call `then` callback
        returnValue = originalThenCb(previousResult);
      }
      finally {
        if (isThenable(returnValue)) {
          // NOTE: we must make sure, that we have the promise's `ValueRef`.
          //  We might not have seen this promise for several reasons:
          //  1. Then callback is an async function.
          //  2. (other reasons?)
          // maybePatchPromise(returnValue);
          dataNodeCollection.createDataNode(returnValue, thenRef.schedulerTraceId, DataNodeType.Read, null);
          setNestingPromise(returnValue, thenRef.postEventPromise);
        }
        thenExecuted(thenRef, previousResult, returnValue);
      }
    }
    finally {
      --activeThenCbCount;
    }
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
  const schedulerTraceId = bceTrace?.traceId;
  if (!schedulerTraceId) {
    warn(`schedulerTraceId not found in PreThen for promise, ref=`, ref);
  }
  return {
    preEventPromise,
    schedulerTraceId
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

      _onThen(thenRef, preEventPromise, postEventPromise);
      return postEventPromise;
    }
  );
}

function patchFinally(holder) {
  if (!holder.finally) {
    return;
  }

  monkeyPatchFunctionRaw(holder, 'finally',
    (preEventPromise, [cb], originalFinally) => {
      const thenRef = _makeThenRef(preEventPromise, originalFinally);
      if (thenRef) {
        maybePatchPromise(preEventPromise);
        cb = patchThenCallback(cb, thenRef);
      }

      const postEventPromise = originalFinally.call(preEventPromise, cb);

      _onThen(thenRef, preEventPromise, postEventPromise);
      return postEventPromise;
    }
  );
}

function _onThen(thenRef, preEventPromise, postEventPromise) {
  maybePatchPromise(postEventPromise);

  setPreThenPromise(postEventPromise, preEventPromise);

  if (thenRef) {
    thenRef.postEventPromise = postEventPromise;
    thenScheduled(thenRef);
  }
}

function patchCatch(holder) {
  if (!holder.catch) {
    return;
  }

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

    toJSON() {
      return {
        _: 'PatchedPromise',
        ...getPromiseData(this)
      };
    }

    toString() {
      return `[PatchedPromise (${JSON.stringify(getPromiseData(this))})]`;
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

function setPreThenPromise(promise, preThenPromise) {
  setPromiseData(promise, {
    preThenPromise
  });
}

function setNestingPromise(promise, nestedBy) {
  const promiseData = getOrCreatePromiseDbuxData(promise);
  if (!promiseData.firstNestedBy) {
    Object.assign(promiseData, {
      firstNestedBy: nestedBy
    });
  }
}

/**
 * @param {*} promise 
 * @param {PromiseRuntimeData} data
 */
export function setPromiseData(promise, data) {
  const promiseData = getOrCreatePromiseDbuxData(promise);
  Object.assign(promiseData, data);
}

function getOrCreatePromiseDbuxData(promise) {
  let { _dbux_: promiseData } = promise;
  if (!promiseData) {
    Object.defineProperty(promise, '_dbux_', {
      value: promiseData = {}
    });
  }
  return promiseData;
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

export function getPromiseAnyRootId(promise) {
  return promise._dbux_?.lastRootId || promise._dbux_?.rootId;
}

export function getPromiseId(promise) {
  return valueCollection.getRefByValue(promise)?.refId;
  // return promise._dbux_?.id;
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

export function maybeSetPromiseFirstEventRootId(promise, lastRootId) {
  if (!getPromiseFirstEventRootId(promise)) {
    setPromiseData(promise, {
      lastRootId,
      firstEventRootId: lastRootId
    });
  }
  else {
    setPromiseData(promise, {
      lastRootId
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