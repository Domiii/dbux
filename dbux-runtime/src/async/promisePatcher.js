import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import ResolveType from '@dbux/common/src/types/constants/ResolveType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import isThenable from '@dbux/common/src/util/isThenable';
import isFunction from 'lodash/isFunction';
import traceCollection from '../data/traceCollection';
import dataNodeCollection from '../data/dataNodeCollection';
import { peekBCEMatchCallee, getLastContextCheckCallee, isInstrumentedFunction, peekBCEMatchCalleeUnchecked } from '../data/dataUtil';
import PromiseRuntimeData from '../data/PromiseRuntimeData';
// import traceCollection from '../data/traceCollection';
import valueCollection from '../data/valueCollection';
// eslint-disable-next-line max-len
import { isMonkeyPatchedFunction, monkeyPatchFunctionHolder, tryRegisterMonkeyPatchedFunction, _registerMonkeyPatchedCallback, _registerMonkeyPatchedFunction } from '../util/monkeyPatchUtil';

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

  if (isMonkeyPatchedFunction(promise.then)) {
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
  if (!isInstrumentedFunction(cb)) {
    // not an instrumented function
    return cb;
  }
  // if (!valueCollection.getRefByValue(cb)) {
  //   // not instrumented
  //   return cb;
  // }

  const originalCb = cb;
  function patchedThenCb(...args) {
    if (activeThenCbCount) {
      // NOTE: then callbacks should never be nested (might hint at a Dbux bug)
      warn(`a "then" callback was called before a previous "then" callback has finished, schedulerTraceId=${thenRef.schedulerTraceId}`);
    }

    // TODO: peekBCEMatchCallee(patchedCb)

    ++activeThenCbCount;

    let returnValue;
    try {
      try {
        // actually call `then` callback
        returnValue = originalCb.call(this, ...args);
      }
      finally {
        const cbContext = getLastContextCheckCallee(originalCb);
        // TODO: cbContext exists, even if `originalCb` was not instrumented for some reason?!
        //    -> need to remove `!isInstrumentedFunction(cb)` check to test

        if (isThenable(returnValue)) {
          // Promise#resolve(Promise) was called: nested promise

          if (!getPromiseId(returnValue)) {
            /**
             * [hackfix-datanode]
             * hackfix: we must make sure, that we have the promise's `ValueRef`.
             * We might not have seen this promise for several reasons:
             *  1. Then callback is an async function.
             * WARNING: this might cause some trouble down the line, since:
             *  1. either this DataNode is not in a meaningful place (lastTraceOfContext).
             *  2. or it is entirely out of order (schedulerTraceId)
             */
            const lastTrace = traceCollection.getLast();
            let dataNodeTraceId;
            if (lastTrace && lastTrace.contextId === cbContext?.contextId) {
              dataNodeTraceId = lastTrace.traceId;
            }
            else {
              dataNodeTraceId = thenRef.schedulerTraceId;
            }
            dataNodeCollection.createDataNode(returnValue, dataNodeTraceId, DataNodeType.Write, null);

            maybePatchPromise(returnValue);
          }

          // console.trace('thenCb', cbContext?.contextId, getPromiseId(returnValue));
          // set async function call's `AsyncEventUpdate.promiseId`
          cbContext && RuntimeMonitorInstance._runtime.async.setAsyncContextPromise(cbContext.contextId, returnValue);
        }
        // thenExecuted(thenRef, previousResult, returnValue);

        // event: PostThen
        RuntimeMonitorInstance._runtime.async.postThen(thenRef, returnValue, cbContext);
      }
    }
    finally {
      --activeThenCbCount;
    }
    return returnValue;
  }

  _registerMonkeyPatchedCallback(cb, patchedThenCb);

  return patchedThenCb;
}

/**
 * 
 * @param {*} promise 
 * @param {*} originalThen 
 * @returns 
 */
function _makeThenRef(promise, patchedFunction) {
  let ref = valueCollection.getRefByValue(promise);

  // NOTE: `patchedFunction` might be called by an uninstrumented library (e.g. bluebird)
  const bceTrace = peekBCEMatchCalleeUnchecked(patchedFunction);
  const schedulerTraceId = bceTrace?.traceId;

  if (!ref) {
    // promise not traced yet!
    if (!schedulerTraceId) {
      // don't know what to do
      return null;
    }

    // hackfix: attach promise DataNode to schedulerTrace
    const dataNode = dataNodeCollection.createBCEOwnDataNode(promise, schedulerTraceId, DataNodeType.Write);
    ref = valueCollection.getById(dataNode.refId);
    maybePatchPromise(promise);
  }



  if (promise instanceof NativePromiseClass && !schedulerTraceId) {
    // NOTE: when `then`ing on async function return value, patched `then` will be called internally
    //    -> `then` called on an unpatched promise instance
    //    -> seemingly happens right after the async function is called (possibly in a new run)
    //    -> this will never be true for Promise ctor call
    return null;
  }
  if (!schedulerTraceId) {
    // eslint-disable-next-line no-console
    console.trace(`schedulerTraceId not found in PreThen for promise, ref=`, ref);
  }
  return {
    preEventPromise: promise,
    schedulerTraceId,
    rootId: RuntimeMonitorInstance.runtime.getCurrentVirtualRootContextId()
  };
}

function patchThen(holder) {
  monkeyPatchFunctionHolder(holder, 'then',
    (preEventPromise, [successCb, failCb], originalThen, patchedThen) => {
      const thenRef = _makeThenRef(preEventPromise, patchedThen);
      if (thenRef) { // NOTE: !!thenRef implies that this is instrumented
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
    (preEventPromise, [cb], originalFinally, patchedFinally) => {
      const thenRef = _makeThenRef(preEventPromise, patchedFinally);
      if (thenRef) {
        cb = patchThenCallback(cb, thenRef);
      }

      const postEventPromise = originalFinally.call(preEventPromise, cb);
      _onThen(thenRef, preEventPromise, postEventPromise);
      return postEventPromise;
    }
  );
}

function patchCatch(holder) {
  if (!holder.catch) {
    return;
  }

  monkeyPatchFunctionHolder(holder, 'catch',
    (preEventPromise, [cb], originalCatch, patchedCatch) => {
      const thenRef = _makeThenRef(preEventPromise, patchedCatch);
      if (thenRef) {
        cb = patchThenCallback(cb, thenRef);
      }

      const postEventPromise = originalCatch.call(preEventPromise, cb);
      _onThen(thenRef, preEventPromise, postEventPromise);
      return postEventPromise;
    }
  );

  // /**
  //  * Same as `then(undefined, failCb)`
  //  * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
  //  */
  // tryRegisterMonkeyPatchedFunction(holder, 'catch', function patchedCatch(failCb) {
  //   RuntimeMonitorInstance.callbackPatcher.monkeyPatchCallee()
  //   const then = getPatchedThen(...);
  //   return then(undefined, failCb);
  // });
}

function _onThen(thenRef, preEventPromise, postEventPromise) {
  if (!thenRef) {
    return;
  }

  if (thenRef.schedulerTraceId) {
    // add DataNode for newly created promise
    dataNodeCollection.createBCEOwnDataNode(postEventPromise, thenRef.schedulerTraceId, DataNodeType.Write);
  }

  maybePatchPromise(postEventPromise);
  thenRef.postEventPromise = postEventPromise;

  // Event: PreThen
  RuntimeMonitorInstance._runtime.async.preThen(thenRef);
}


// ###########################################################################
// patchPromiseClass + prototype
// ###########################################################################

// const promiseCtorStack = [];

function patchPromiseMethods(holder) {
  // NOTE: we do this to tag promise prototypes -> so we don't accidentally re-register those
  // getOrCreatePromiseDbuxData(holder);

  patchThen(holder);
  patchCatch(holder);
  patchFinally(holder);
}

function patchPromiseClass(BasePromiseClass) {
  class PatchedPromise extends BasePromiseClass {
    constructor(originalExecutor) {
      const isExecutorInstrumented = isInstrumentedFunction(originalExecutor);
      let patchedExecutor;
      /**
       * NOTE: In case, `resolve` or `reject` is called synchronously from the ctor, `this` cannot be accessed because `super` has not finished yet.
       * That is why, we need to defer such call to after `super` call completed.
       */
      let deferredCall;
      let superCalled = false;

      /**
       * hackfix: use a placeholder (since we cannot get a promiseId, before promise actually exists)
       */
      const promiseIdPlaceholder = valueCollection.generatePlaceholder();

      if (!isExecutorInstrumented) {
        patchedExecutor = originalExecutor;
      }
      else {
        // wrapExecutor = executor;

        patchedExecutor = (resolve, reject) => {
          const executorRootId = RuntimeMonitorInstance.runtime.getCurrentVirtualRootContextId();

          const wrapResolve = (...args) => {
            // Event: resolve
            // TODO: track `result` data flow
            const resolveArg = args[0];
            if (!superCalled) {
              deferredCall = wrapResolve.bind(null, resolveArg);
            }
            else {
              const thenRef = _makeThenRef(this, wrapResolve);
              if (thenRef) {
                const inner = resolveArg;
                const thisPromiseId = getPromiseId(this) || 0;
                const asyncPromisifyPromiseId = executorRootId !== thenRef.rootId ? thisPromiseId : 0; // we only care about promisify, if async
                RuntimeMonitorInstance._runtime.async.resolve(
                  inner, this, ResolveType.Resolve, thenRef.schedulerTraceId, asyncPromisifyPromiseId
                );
              }
              resolve(...args);
            }
          };
          const wrapReject = (...args) => {
            // Event: reject
            // TODO: track `err` data flow
            const err = args[0];
            if (!superCalled) {
              deferredCall = wrapReject.bind(null, err);
            }
            else {
              const thenRef = _makeThenRef(this, wrapReject);
              if (thenRef) {
                // NOTE: reject can also nest a promise (but will pass the promise (not its resolved value) to `catch`)
                const inner = err;
                const thisPromiseId = getPromiseId(this) || 0;
                const asyncPromisifyPromiseId = executorRootId !== thenRef.rootId ? thisPromiseId : 0; // we only care about promisify, if async
                RuntimeMonitorInstance._runtime.async.resolve(
                  inner, this, ResolveType.Reject, thenRef.schedulerTraceId, asyncPromisifyPromiseId
                );
              }
              reject(...args);
            }
          };

          try {
            // maintain promisify stack
            RuntimeMonitorInstance.runtime.promisifyStart(promiseIdPlaceholder);

            // call actual executor
            originalExecutor(wrapResolve, wrapReject);
          }
          finally {
            RuntimeMonitorInstance.runtime.promisifyEnd(promiseIdPlaceholder);
          }
        };
      }

      // const lastUpdateId = asyncEventUpdateCollection.getLastId();

      // call actual ctor
      super(patchedExecutor);

      if (isExecutorInstrumented) {
        // -> make sure `promiseId` is registered (exception: add to BCE for now)
        const bce = peekBCEMatchCalleeUnchecked(PatchedPromise);
        const dataNode = bce && dataNodeCollection.createBCEOwnDataNode(this, bce.traceId, DataNodeType.Write);

        // resolve placeholder
        promiseIdPlaceholder.resolve(dataNode?.refId || 0);
      }

      // finally // NOTE: if an exception was thrown during `super`, `this` must not be accessed.
      superCalled = true;

      if (deferredCall) {
        // deferred until after `super` was called

        deferredCall();
      }

      // if (isCallbackInstrumented) {
      //   const promiseId = getPromiseId(this);
      //   RuntimeMonitorInstance._runtime.async.promiseCtorCalled(promiseId, lastUpdateId);
      // }
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

  // register this, so we don't accidentally patch its arguments
  _registerMonkeyPatchedFunction(Promise, PatchedPromise);

  patchPromiseMethods(BasePromiseClass.prototype);

  return PatchedPromise;
}


// ###########################################################################
// promise data
// ###########################################################################


export function getPromiseId(promise) {
  return valueCollection.getRefByValue(promise)?.refId;
  // return promise._dbux_?.id;
}

let lastPromiseId = 0;

// function newPromiseId() {
//   return ++lastPromiseId;
// }

// function recordUnseenPromise(promise) {
//   const currentRootId = RuntimeMonitorInstance.getCurrentVirtualRootContextId();
//   setPromiseData(promise, {
//     rootId: currentRootId,
//     id: newPromiseId()
//   });
// }

/**
 * @param {*} promise 
 * @param {PromiseRuntimeData} data
 */
export function setPromiseData(promise, data) {
  const promiseData = getOrCreatePromiseDbuxData(promise);
  Object.assign(promiseData, data);
}

/**
 * @deprecated
 */
const promiseDataMap = new WeakMap();

/**
 * @deprecated
 */
function getOrCreatePromiseDbuxData(promise) {
  let promiseData = promiseDataMap.get(promise);
  if (!promiseData) {
    promiseDataMap.set(promise, promiseData = {});
  }
  return promiseData;
}

/**
 * @deprecated
 */
export function hasRecordedPromiseData(promise) {
  return !!promiseDataMap.get(promise);
}

/**
 * @deprecated
 * @returns {PromiseRuntimeData}
 */
export function getPromiseData(promise) {
  return promiseDataMap.get(promise) || EmptyObject;
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

/** ###########################################################################
 * built-ins
 * ##########################################################################*/

monkeyPatchFunctionHolder(Promise, 'resolve',
  (thisArg, args, originalFunction, patchedFunction) => {
    const value = args[0];
    const result = originalFunction.apply(thisArg, args);

    if (value !== result && isThenable(value) && getPromiseId(value)) {
      const thenRef = _makeThenRef(result, patchedFunction);

      RuntimeMonitorInstance._runtime.async.resolve(value, result, ResolveType.Resolve, thenRef?.schedulerTraceId);
    }

    return result;
  }
);

monkeyPatchFunctionHolder(Promise, 'reject',
  (thisArg, args, originalFunction, patchedFunction) => {
    const value = args[0];
    const result = originalFunction.apply(thisArg, args);

    if (value !== result && isThenable(value) && getPromiseId(value)) {
      const thenRef = _makeThenRef(result, patchedFunction);

      RuntimeMonitorInstance._runtime.async.resolve(value, result, ResolveType.Reject, thenRef?.schedulerTraceId);
    }

    return result;
  }
);
