import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import ResolveType from '@dbux/common/src/types/constants/ResolveType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import isThenable from '@dbux/common/src/util/isThenable';
import { isFunction } from 'lodash';
import asyncEventUpdateCollection from '../data/asyncEventUpdateCollection';
import dataNodeCollection from '../data/dataNodeCollection';
import { peekBCEMatchCallee, peekContextCheckCallee } from '../data/dataUtil';
import PromiseRuntimeData from '../data/PromiseRuntimeData';
// import traceCollection from '../data/traceCollection';
import valueCollection from '../data/valueCollection';
import { isMonkeyPatchedOther, monkeyPatchFunctionHolder } from '../util/monkeyPatchUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError } = newLogger('PromisePatcher');

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

/**
 * NOTE: library might be using non-native promises.
 *    This is only (a very crude, desperate) attempt at getting that patched up early.
 *    -> In all likelihood will not work too well.
 */
export const OriginalPromiseClass = Promise;

/**
 * hackfix: prevent circular dependency
 */
valueCollection.maybePatchPromise = maybePatchPromise;


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
// patchPromise
// ###########################################################################

export function maybePatchPromise(promise) {
  if (PromiseInstrumentationDisabled) {
    return;
  }
  // console.trace(`maybePatchPromise`, getPromiseId(promise));
  if (hasRecordedPromiseData(promise)) {
    return;
  }
  recordUnseenPromise(promise);

  if (isMonkeyPatchedOther(promise.then)) {
    return;
  }

  // console.trace('new promise', valueRef.refId);

  patchPromise(promise);
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
function patchThenCallback(cb, thenRef) {
  if (!isFunction(cb)) {
    // not a cb
    return cb;
  }
  if (!valueCollection.getRefByValue(cb)) {
    // not instrumented
    return cb;
  }

  const originalCb = cb;
  return function patchedCb(previousResult) {
    if (activeThenCbCount) {
      // NOTE: then callbacks should not observe nested calls
      warn(`a "then" callback was called before a previous "then" callback has finished, schedulerTraceId=${thenRef.schedulerTraceId}`);
    }

    // TODO: peekBCEMatchCallee(patchedCb)

    ++activeThenCbCount;

    let returnValue;
    try {
      try {
        // actually call `then` callback
        returnValue = originalCb(previousResult);
      }
      finally {
        if (isThenable(returnValue)) {
          // NOTE: we must make sure, that we have the promise's `ValueRef`.
          //  We might not have seen this promise for several reasons:
          //  1. Then callback is an async function.
          //  2. (other reasons?)
          // maybePatchPromise(returnValue);
          dataNodeCollection.createDataNode(returnValue, thenRef.schedulerTraceId, DataNodeType.Read, null);

          // set async function's returnValue promise (used to set AsyncEventUpdate.promiseId)
          const cbContext = peekContextCheckCallee(originalCb);
          // console.trace('thenCb', cbContext?.contextId, getPromiseId(returnValue));
          cbContext && RuntimeMonitorInstance._runtime.async.setAsyncContextPromise(cbContext.contextId, returnValue);

          // set nestingPromiseId
          setNestingPromise(returnValue, thenRef.postEventPromise);
        }
        // thenExecuted(thenRef, previousResult, returnValue);

        // event: PostThen
        RuntimeMonitorInstance._runtime.async.postThen(thenRef, returnValue);
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
 * @param {*} promise 
 * @param {*} originalThen 
 * @returns 
 */
function _makeThenRef(promise, cb) {
  const ref = valueCollection.getRefByValue(promise);
  if (!ref) {
    // not traced!
    return null;
  }

  return _makeThenRefUnchecked(promise, cb);
}

function _makeThenRefUnchecked(promise, cb) {
  const bceTrace = peekBCEMatchCallee(cb);
  const schedulerTraceId = bceTrace?.traceId;

  if (promise instanceof NativePromiseClass && !schedulerTraceId) {
    // NOTE: when `then`ing async functions, patched `then` will be called internally
    //    -> called on an unpatched promise instance
    //    -> seemingly happens right after the async function is called (possibly in a new run)
    return null;
  }
  if (!schedulerTraceId) {
    const ref = valueCollection.getRefByValue(promise);
    // eslint-disable-next-line no-console
    console.trace(`schedulerTraceId not found in PreThen for promise, ref=`, ref);
  }
  return {
    preEventPromise: promise,
    schedulerTraceId
  };
}

function patchThen(holder) {
  monkeyPatchFunctionHolder(holder, 'then',
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

  monkeyPatchFunctionHolder(holder, 'finally',
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
  if (!thenRef) {
    return;
  }

  maybePatchPromise(postEventPromise);
  setPreThenPromise(postEventPromise, preEventPromise);
  thenRef.postEventPromise = postEventPromise;

  // Event: PreThen
  RuntimeMonitorInstance._runtime.async.preThen(thenRef);
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

const promiseCtorStack = [];

function patchPromiseMethods(holder) {
  // NOTE: we do this to tag promise prototypes -> so we don't accidentally re-register those
  getOrCreatePromiseDbuxData(holder);

  patchThen(holder);
  patchCatch(holder);
  patchFinally(holder);
}

function patchPromiseClass(BasePromiseClass) {
  class PatchedPromise extends BasePromiseClass {
    constructor(executor) {
      const bceTrace = peekBCEMatchCallee(PatchedPromise);
      const isCallbackInstrumented = !!bceTrace && typeof executor === 'function'; // check if its a function, too
      let wrapExecutor;
      /**
       * NOTE: In case, `resolve` or `reject` is called synchronously from the ctor, `this` cannot be accessed because `super` has not finished yet.
       * That is why, we need to defer such call to after `super` call completed.
       */
      let deferredCall;
      let superCalled = false;

      if (!isCallbackInstrumented) {
        wrapExecutor = executor;
      }
      else {
        // wrapExecutor = executor;
        wrapExecutor = (resolve, reject) => {
          const wrapResolve = (resolveArg) => {
            // Event: Resolve
            if (!superCalled) {
              deferredCall = wrapResolve.bind(null, resolveArg);
            }
            else {
              // TODO: track `result` data flow
              const thenRef = _makeThenRef(this, wrapResolve);
              if (thenRef) {
                RuntimeMonitorInstance._runtime.async.resolve(thenRef, resolveArg, ResolveType.Resolve);
              }
              resolve(resolveArg);
            }
          };
          const wrapReject = (err) => {
            // Event: Resolve
            if (!superCalled) {
              deferredCall = wrapReject.bind(null, err);
            }
            else {
              // TODO: track `err` data flow
              const thenRef = _makeThenRef(this, wrapReject);
              if (thenRef) {
                RuntimeMonitorInstance._runtime.async.resolve(thenRef, err, ResolveType.Reject);
              }
              reject(err);
            }
          };

          executor(wrapResolve, wrapReject);
        };
      }

      // call actual ctor
      const lastUpdateId = asyncEventUpdateCollection.getLastId();
      // try 
      super(wrapExecutor);

      // finally // NOTE: if an exception was thrown during `super`, `this` must not be accessed.
      superCalled = true;

      if (isCallbackInstrumented) {
        maybePatchPromise(this);
      }

      // deferred until after `super` was called
      deferredCall?.();

      if (isCallbackInstrumented) {
        const promiseId = getPromiseId(this);
        RuntimeMonitorInstance._runtime.async.promiseCtorCalled(promiseId, lastUpdateId);
      }
    }

    // toJSON() {
    //   return {
    //     _: 'PatchedPromise',
    //     ...getPromiseData(this)
    //   };
    // }

    toString() {
      return `[PatchedPromise (#${getPromiseId(this)})]`;
    }
  }

  patchPromiseMethods(BasePromiseClass.prototype);

  return PatchedPromise;
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

const promiseDataMap = new WeakMap();

function getOrCreatePromiseDbuxData(promise) {
  let promiseData = promiseDataMap.get(promise);
  if (!promiseData) {
    promiseDataMap.set(promise, promiseData = {});
  }
  return promiseData;
}

export function hasRecordedPromiseData(promise) {
  return !!promiseDataMap.get(promise);
}

/**
 * @returns {PromiseRuntimeData}
 */
export function getPromiseData(promise) {
  return promiseDataMap.get(promise) || EmptyObject;
}

export function getPromiseId(promise) {
  return valueCollection.getRefByValue(promise)?.refId;
  // return promise._dbux_?.id;
}

export function getPromiseOwnAsyncFunctionContextId(promise) {
  return getPromiseData(promise).asyncFunctionContextId;
}

// export function maybeSetPromiseFirstEventRootId(promise, lastRootId) {
//   if (!getPromiseFirstEventRootId(promise)) {
//     setPromiseData(promise, {
//       lastRootId,
//       firstEventRootId: lastRootId
//     });
//   }
//   else {
//     setPromiseData(promise, {
//       lastRootId
//     });
//   }
// }

// export function pushPromisePendingRootId(promise, pendingRootId) {
//   const _dbux_ = getOrCreatePromiseDbuxData(promise);
//   let { pendingRootIds } = _dbux_;
//   if (!pendingRootIds) {
//     pendingRootIds = _dbux_.pendingRootIds = [];
//   }
//   pendingRootIds.push(pendingRootId);
// }