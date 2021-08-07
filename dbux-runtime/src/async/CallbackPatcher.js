// import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import isThenable from '@dbux/common/src/util/isThenable';
import { newLogger } from '@dbux/common/src/log/logger';
import { isFunction } from 'lodash';
import valueCollection from '../data/valueCollection';
import { peekBCEMatchCallee, getFirstTraceOfRefValue, isInstrumentedFunction } from '../data/dataUtil';
import { getOrPatchFunction, getPatchedFunction, monkeyPatchFunctionHolder, monkeyPatchFunctionOverride, monkeyPatchGlobalRaw } from '../util/monkeyPatchUtil';
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
  // patchCallback
  // ###########################################################################

  // TODO: replace this with generic `patchCallback`
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

  patchCallback(arg, schedulerTraceId) {
    if (!isInstrumentedFunction(arg)) {
      return arg;
    }

    const originalCb = arg;

    const { runtime } = this;

    // const self = this; // NOTE: `this` will be the callback's `this`

    return function patchedCallback(...args) {
      let returnValue;
      try {
        // actually call callback
        returnValue = originalCb.call(this, ...args);
      }
      finally {
        const context = executionContextCollection.getLastRealContext();
        const rootId = runtime.getCurrentVirtualRootContextId();
        if (context?.contextId === rootId) {
          // the CB was called asynchronously

          // const cbContext = peekContextCheckCallee(originalCb);
          const runId = runtime.getCurrentRunId();
          // const trace = getFirstTraceOfRefValue(callee);
          // const staticTrace = trace && staticTraceCollection.getById(trace.staticTraceId);
          // const traceType = staticTrace?.type;
          // const isInstrumentedFunction = traceType && isFunctionDefinitionTrace(traceType);
          runtime.async.postCallback(schedulerTraceId, runId, rootId);
        }
        else {
          // CB was called synchronously -> we are not interested
        }
      }
      return returnValue;
    };
  }

  // ###########################################################################
  // monkeyPatchCallee
  // ###########################################################################

  calleePatcher = (calleeTid, callId, originalFunction) => {
    const self = this; // NOTE: `this` will be the callee's `this`

    return function patchedCallee(...args) {
      // NOTE: the registered value for callee is `originalFunction`, not `patchedFunction`
      const bceTrace = peekBCEMatchCallee(originalFunction);
      const schedulerTraceId = bceTrace?.traceId;
      let patchedArgs = args.map(arg => {
        // add an extra layer on instrumented functions
        return self.patchCallback(arg, schedulerTraceId);
      });

      const result = originalFunction.call(this, ...patchedArgs);

      if (schedulerTraceId) {
        self.runtime.async.preCallback(schedulerTraceId);
      }

      return result;
    };
  };

  monkeyPatchCallee(originalFunction, calleeTid, callId) {
    if (isFunction(originalFunction)) {
      if (!isClass(originalFunction)) {
        // callee is (probably) function, not es6 ctor

        if (!isInstrumentedFunction(originalFunction)) {
          // NOTE: `@dbux/runtime` calls should not be hit by this
          // TODO: fix for `bind`, `apply`, `call` -> need a new identity for functions that goes beyond `refId`

          // not instrumented -> monkey patch it
          let f = getPatchedFunction(originalFunction);
          if (!f) {
            f = monkeyPatchFunctionOverride(originalFunction, this.calleePatcher.bind(this, calleeTid, callId));
          }
          return f;
        }
        else {
          // -> uninstrumented function
          // -> ignore
        }
      }
      else {
        // -> es6 class
        // -> ignore
        // future-work: also patch es6 classes?
      }
    }

    return originalFunction;
  }
}