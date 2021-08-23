// import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import isThenable from '@dbux/common/src/util/isThenable';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import { peekBCEMatchCallee, isInstrumentedFunction, getFirstContextAfterTrace, getTraceStaticTrace } from '../data/dataUtil';
import { getPatchedFunctionOrNull, monkeyPatchFunctionOverride, _registerMonkeyPatchedFunction } from '../util/monkeyPatchUtil';
// import executionContextCollection from '../data/executionContextCollection';
import traceCollection from '../data/traceCollection';


function containsInstrumentedCallbacks(args, spreadArgs) {
  spreadArgs = spreadArgs || EmptyArray;
  return args?.some((arg, i) => {
    if (spreadArgs[i]) {
      // check all spread args
      return spreadArgs[i].some(isInstrumentedFunction);
    }
    // check regular arg
    return isInstrumentedFunction(arg);
  }) || false;
}

// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError, trace } = newLogger('CallbackPatcher');

/** @typedef {import('../RuntimeMonitor').default} RuntimeMonitor */

export default class CallbackPatcher {
  /**
   * @type {RuntimeMonitor}
   */
  _runtimeMonitorInstance;

  patchersByFunction = new Map();

  get runtime() {
    return this._runtimeMonitorInstance.runtime;
  }

  // ###########################################################################
  // ctor
  // ###########################################################################

  constructor(_runtimeMonitorInstance) {
    this._runtimeMonitorInstance = _runtimeMonitorInstance;

    // this.patchSetTimeout();
  }

  init() { }

  // // ###########################################################################
  // // setTimeout
  // // ###########################################################################

  // patchSetTimeout() {
  //   monkeyPatchGlobalRaw('setTimeout',
  //     (_ /* global */, [cb, delayMs, ...args], originalSetTimeout, patchedSetTimeout) => {
  //       const bceTrace = peekBCEMatchCallee(patchedSetTimeout);
  //       const schedulerTraceId = bceTrace?.traceId;
  //       if (schedulerTraceId) {
  //         cb = this.patchSetTimeoutCallback(cb, schedulerTraceId);
  //       }

  //       const timer = originalSetTimeout(cb, delayMs, ...args);

  //       if (schedulerTraceId) {
  //         this.runtime.async.preCallback(schedulerTraceId);
  //       }

  //       return timer;
  //     }
  //   );
  // }

  // patchSetTimeoutCallback(cb, schedulerTraceId) {
  //   if (!isFunction(cb)) {
  //     // not a cb
  //     return cb;
  //   }
  //   if (!valueCollection.getRefByValue(cb)) {
  //     // not instrumented
  //     return cb;
  //   }

  //   const originalCb = cb;

  //   const { runtime } = this;

  //   return function patchedPromiseCb(...args) {
  //     let returnValue;
  //     // TODO: peekBCEMatchCallee(patchedCb)
  //     try {
  //       // actually call `then` callback
  //       returnValue = originalCb(...args);
  //     }
  //     finally {
  //       // const cbContext = peekContextCheckCallee(originalCb);
  //       const runId = runtime.getCurrentRunId();
  //       const rootId = runtime.getCurrentVirtualRootContextId();
  //       const context = executionContextCollection.getLastRealContext();

  //       if (context?.contextId === rootId) {
  //         // the CB was called asynchronously
  //         runtime.async.postCallback(schedulerTraceId, runId, rootId);
  //       }
  //     }
  //     return returnValue;
  //   };
  // }


  // ###########################################################################
  // patchCallback
  // ###########################################################################


  callbackPatcher(arg, schedulerTraceId) {
    const originalCallback = arg;
    const { runtime } = this;


    // let f = getPatchedFunctionOrNull(originalFunction);
    // if (!f) {
    //   const calleePatcher = this.defaultCalleePatcher;

    //   f = monkeyPatchFunctionOverride(
    //     originalFunction,
    //     calleePatcher.bind(this, callId)
    //   );
    // }

    // const self = this; // NOTE: `this` will be the callback's `this`

    function patchedCallback(...args) {
      let returnValue;
      const lastTraceId = traceCollection.getLast().traceId;
      try {
        // actually call callback
        returnValue = originalCallback.call(this, ...args);
      }
      finally {
        // NOTE: there is no BCE, since the callback (in all likelihood) was invoked by the JS runtime
        const context = getFirstContextAfterTrace(lastTraceId);
        if (!context) {
          trace(`Instrumentation failed. No context was created after executing callback "${originalCallback.name} (${originalCallback})".`);
        }
        else {
          const rootId = runtime.getCurrentVirtualRootContextId();

          // warn(`[patchedCallback] lastTrace=${lastTraceId}, cid=${context.contextId}, rootId=${rootId}, schedulerTraceId=${schedulerTraceId}`);

          if (context.contextId !== rootId) {
            // CB was called synchronously -> we are not interested
          }
          else {
            // the CB was called asynchronously

            // const cbContext = peekContextCheckCallee(originalCb);
            const runId = runtime.getCurrentRunId();
            // const trace = getFirstTraceOfRefValue(callee);
            // const staticTrace = trace && staticTraceCollection.getById(trace.staticTraceId);
            // const traceType = staticTrace?.type;
            // const isInstrumentedFunction = traceType && isFunctionDefinitionTrace(traceType);
            runtime.async.postCallback(schedulerTraceId, runId, rootId);
          }
        }
      }
      return returnValue;
    }

    _registerMonkeyPatchedFunction(originalCallback, patchedCallback);

    return patchedCallback;
  }

  // ###########################################################################
  // monkeyPatchCallee
  // ###########################################################################

  defaultCalleePatcher = (callId, originalFunction) => {
    const self = this; // NOTE: inside `patchedCallee` `this` will be the callee's `this`
    const eventListenerRegex = /^on[A-Z]|event/;
    const isEventListener = !!(originalFunction.name || '').match(eventListenerRegex);

    return function patchedCallee(...args) {
      if (this instanceof patchedCallee) {
        // -> `originalFunction` is a ctor
        trace(`patched constructor call (new ${originalFunction.name})`);
      }

      // // NOTE: the registered value for callee is `originalFunction`, not `patchedFunction`
      // const bceTrace = peekBCEMatchCallee(originalFunction);
      // const schedulerTraceId = bceTrace?.traceId;
      const schedulerTraceId = callId;
      let hasInstrumentedCallback = false;
      if (schedulerTraceId) {
        args = args.map(arg => {
          // add an extra layer on instrumented functions
          if (!isInstrumentedFunction(arg)) {
            return arg;
          }
          hasInstrumentedCallback = true;
          return self.callbackPatcher(arg, schedulerTraceId);
        });
      }

      // console.trace(`calleePatcher ${originalFunction.name}`);
      const result = originalFunction.call(this, ...args);

      if (hasInstrumentedCallback) {
        self.runtime.async.preCallback(schedulerTraceId, isEventListener);
      }

      return result;
    };
  };

  /**
   * Dynamically "monkey-patch-override" a function (if needed).
   * @return the function that will end up getting called instead of originalFunction.
   */
  monkeyPatchCallee(originalFunction, callId, args, spreadArgs) {
    // if (!argTids.length) {
    //   // monkey patching is only necessary for instrumenting callback arguments -> nothing to do
    //   return originalFunction;
    // }
    const bceStaticTrace = getTraceStaticTrace(callId);

    if (
      // do not auto-patch classes/ctors (for now)
      !bceStaticTrace.data?.isNew &&

      // only instrument functions if they themselves are not instrumented (recorded)
      !isInstrumentedFunction(originalFunction) &&

      // only patch if it passes on callbacks of instrumented functions
      containsInstrumentedCallbacks(args, spreadArgs)
    ) {
      // should instrument -> monkey patch it
      let f = getPatchedFunctionOrNull(originalFunction);
      if (!f) {
        const calleePatcher = this.defaultCalleePatcher;

        f = monkeyPatchFunctionOverride(
          originalFunction,
          calleePatcher.bind(this, callId)
        );
      }
      return f;
    }

    return originalFunction;
  }
}
