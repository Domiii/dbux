// import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import isThenable from '@dbux/common/src/util/isThenable';
import { newLogger } from '@dbux/common/src/log/logger';
import { isFunction } from 'lodash';
import valueCollection from '../data/valueCollection';
import { peekBCEMatchCallee, getFirstTraceOfRefValue, isInstrumentedFunction } from '../data/dataUtil';
import { monkeyPatchGlobalRaw } from '../util/monkeyPatchUtil';
import executionContextCollection from '../data/executionContextCollection';


/**
 * @see https://stackoverflow.com/a/30760236
 */
function isClass(value) {
  return typeof value === 'function' && /^\s*class\s+/.test(value.toString());
}



// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError } = newLogger('patchPromise');

/** @typedef {import('../RuntimeMonitor').default} RuntimeMonitor */

export default class CallbackPatcher {
  /**
   * @type {RuntimeMonitor}
   */
  _runtimeMonitorInstance;

  get runtime() {
    return this._runtimeMonitorInstance.runtime;
  }

  // ###########################################################################
  // ctor
  // ###########################################################################

  constructor(_runtimeMonitorInstance) {
    this._runtimeMonitorInstance = _runtimeMonitorInstance;

    this.patchSetTimeout();
  }

  // ###########################################################################
  // cb
  // ###########################################################################

  patchSetTimeoutCallback(cb, schedulerTraceId) {
    if (!isFunction(cb)) {
      // not a cb
      return cb;
    }
    if (!valueCollection.getRefByValue(cb)) {
      // not instrumented
      return cb;
    }

    const originalCb = cb;

    const { runtime } = this;

    return function patchedPromiseCb(...args) {
      let returnValue;
      // TODO: peekBCEMatchCallee(patchedCb)
      try {
        // actually call `then` callback
        returnValue = originalCb(...args);
      }
      finally {
        // const cbContext = peekContextCheckCallee(originalCb);
        const runId = runtime.getCurrentRunId();
        const rootId = runtime.getCurrentVirtualRootContextId();
        const context = executionContextCollection.getLastRealContext();

        if (context?.contextId === rootId) {
          // the CB was called asynchronously
          runtime.async.postCallback(schedulerTraceId, runId, rootId);
        }
      }
      return returnValue;
    };
  }

  // ###########################################################################
  // setTimeout
  // ###########################################################################

  patchSetTimeout() {
    monkeyPatchGlobalRaw('setTimeout',
      (_ /* global */, [cb, delayMs, ...args], originalSetTimeout, patchedSetTimeout) => {
        const bceTrace = peekBCEMatchCallee(patchedSetTimeout);
        const schedulerTraceId = bceTrace?.traceId;
        if (schedulerTraceId) {
          cb = this.patchSetTimeoutCallback(cb, schedulerTraceId);
        }

        const timer = originalSetTimeout(cb, delayMs, ...args);

        if (schedulerTraceId) {
          this.runtime.async.preCallback(schedulerTraceId);
        }

        return timer;
      }
    );
  }

  // ###########################################################################
  // monkeyPatchCallee
  // ###########################################################################

  monkeyPatchCallee(callee, calleeTid) {
    if (!isClass(callee)) {
      // callee is (probably) function, not es6 ctor

      // const trace = getFirstTraceOfRefValue(callee);
      // const staticTrace = trace && staticTraceCollection.getById(trace.staticTraceId);
      // const traceType = staticTrace?.type;
      // const isInstrumentedFunction = traceType && isFunctionDefinitionTrace(traceType);

      if (!isInstrumentedFunction(callee)) {
        // TODO: fix for `bind`, `apply`, `call` -> need a new identity for functions that goes beyond `refId`
        //    What about ramda etc?
        //    -> no-op if not asynchronously called

        // not instrumented -> monkey patch it
        // TODO: patch -> auto-instrument all function arguments
      }
    }
    else {
      // ignore un-instrumented ctors for now
      // future-work: make this work
    }

    return callee;
  }
}