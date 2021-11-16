// import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import isThenable from '@dbux/common/src/util/isThenable';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import { isInstrumentedFunction, getFirstContextAfterTrace } from '../data/dataUtil';
// eslint-disable-next-line max-len
import { getOriginalCallback, getPatchedFunctionOrNull, isMonkeyPatchedCallback, isOrHasMonkeyPatchedFunction, _registerMonkeyPatchedCallback, _registerMonkeyPatchedFunction } from '../util/monkeyPatchUtil';
// import executionContextCollection from '../data/executionContextCollection';
import executionContextCollection from '../data/executionContextCollection';
import traceCollection from '../data/traceCollection';
import valueCollection from '../data/valueCollection';


function containsInstrumentedCallbacks(args, spreadArgs) {
  spreadArgs = spreadArgs || EmptyArray;
  return args.some((arg, i) => {
    if (spreadArgs[i]) {
      // check all spread args
      return spreadArgs[i].some(isInstrumentedFunction);
    }
    // check regular arg
    return isInstrumentedFunction(arg);
  });
}

function countInstrumentedCallbacks(args, spreadArgs) {
  spreadArgs = spreadArgs || EmptyArray;
  return args.reduce((acc, arg, i) => {
    if (spreadArgs[i]) {
      // check all spread args
      return acc + spreadArgs[i].reduce((nestedAcc, nestedArg) => nestedAcc + !!isInstrumentedFunction(nestedArg), 0);
    }
    // check regular arg
    return acc + !!isInstrumentedFunction(arg);
  }, 0);
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
  ignoreCallbacks = new Set();

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

  addCallbackIgnoreFunction(originalFunction) {
    this.ignoreCallbacks.add(originalFunction);
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
  //       // const cbContext = getLastContextCheckCallee(originalCb);
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


  patchCallback(originalCallback, schedulerTraceId, promisifyPromiseVirtualRef) {
    const { runtime } = this;

    if (isMonkeyPatchedCallback(originalCallback)) {
      const argOrig = getOriginalCallback(originalCallback);
      trace(`callback argument already patched - ${argOrig.name} (${argOrig.toString().replace(/\s+/g, ' ').substring(0, 30)}) -\n  scheduler=`,
        traceCollection.makeTraceInfo(schedulerTraceId));
      return originalCallback;
    }

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
      // const lastTraceId = traceCollection.getLast()?.traceId;
      const lastContextId = executionContextCollection.getLast()?.contextId;

      // TODO: test this `process.nextTick` used from inside nested async functions

      const realRootId = runtime.peekRealRootContextId();

      // keep maintaining promisify stack
      runtime.promisifyStart(promisifyPromiseVirtualRef);
      try {
        // actually call callback
        returnValue = originalCallback.call(this, ...args);
      }
      finally {
        runtime.promisifyEnd(promisifyPromiseVirtualRef);
        
        if (!lastContextId) {
          // NOTE: should never happen, since we have already patched the callback?
        }
        else if (realRootId) {
          // CB was called synchronously -> ignore
        }
        else {
          // hackfix: this is a very naive way to get the context
          //    <- it also can easily bug out, especially, if we are not at the root (e.g. in hexo#4)
          //    NOTE: there is no BCE, since the callback (in all likelihood) was invoked by the JS runtime
          // const context = getFirstContextAfterTrace(lastTraceId);
          const context = executionContextCollection.getById(lastContextId + 1);
          if (!context) {
            // NOTE: this can happen if a patched cb is executed via {@link valueCollection#_readProperty), where recording is disabled
            // trace(`Instrumentation failed. No context was created after executing callback "${originalCallback.name} (${originalCallback})".`);
          }
          else {
            const rootId = runtime.getCurrentVirtualRootContextId();

            if (context.contextId !== rootId) {
              // CB was called synchronously -> we are not interested
            }
            else {
              // warn(`[patchedCallback] lastTrace=${lastTraceId}, cid=${context.contextId}, rootId=${rootId}, schedulerTraceId=${schedulerTraceId}`);
              // the CB was called asynchronously

              // const cbContext = getLastContextCheckCallee(originalCb);
              const runId = runtime.getCurrentRunId();
              // const trace = getFirstTraceOfRefValue(callee);
              // const staticTrace = trace && staticTraceCollection.getById(trace.staticTraceId);
              // const traceType = staticTrace?.type;
              // const isInstrumentedFunction = traceType && isFunctionDefinitionTrace(traceType);
              runtime.async.postCallback(schedulerTraceId, runId, rootId, context.contextId, promisifyPromiseVirtualRef);
            }
          }
        }
      }
      return returnValue;
    }

    _registerMonkeyPatchedCallback(originalCallback, patchedCallback);

    return patchedCallback;
  }

  // ###########################################################################
  // monkeyPatchCallee
  // ###########################################################################

  // defaultCalleePatcher = (firstCallId, originalFunction) => {
  //   if (!originalFunction) {
  //     trace(`tried to patch non-existing callback (at ${traceCollection.makeTraceInfo(firstCallId)})`);
  //     return originalFunction;
  //   }

  //   const self = this; // NOTE: inside `patchedCallee` `this` will be the callee's `this`
  //   const eventListenerRegex = /^on[A-Z]|event/;
  //   const isEventListener = !!(originalFunction.name || '').match(eventListenerRegex);
  //   // const schedulerTraceId = firstCallId;

  //   return function patchedCallee(...args) {
  //     if (this instanceof patchedCallee) {
  //       // -> `originalFunction` is a ctor
  //       trace(`patched constructor call - new ${originalFunction.name} -`, originalFunction);
  //     }

  //     // // NOTE: the registered value for callee is `originalFunction`, not `patchedFunction`
  //     const bceTrace = peekBCEMatchCallee(originalFunction);
  //     const schedulerTraceId = bceTrace?.traceId;

  //     let hasInstrumentedCallback = false;
  //     if (schedulerTraceId) {
  //       args = args.map(arg => {
  //         if (!isInstrumentedFunction(arg)) {
  //           return arg;
  //         }

  //         // wrap callbacks
  //         const newArg = self.patchCallback(arg, schedulerTraceId);
  //         hasInstrumentedCallback = !!newArg;
  //         return newArg || arg;
  //       });
  //     }

  //     // console.trace(`calleePatcher ${originalFunction.name}`);
  //     const result = originalFunction.call(this, ...args);

  //     if (hasInstrumentedCallback) {
  //       self.runtime.async.preCallback(schedulerTraceId, isEventListener);
  //     }

  //     return result;
  //   };
  // };

  checkAndCountInstrumentedCallbacks(originalFunction, args, spreadArgs) {
    return (
      // only instrument callbacks of functions that themselves are not instrumented (recorded)
      !isInstrumentedFunction(originalFunction) &&

      // don't apply dynamic callback patching to already monkey-patched built-ins
      !isOrHasMonkeyPatchedFunction(originalFunction) &&

      // only patch if it passes on callbacks of instrumented functions
      countInstrumentedCallbacks(args, spreadArgs)
    ) || 0;
  }

  maybeMonkeyPatchCallback(arg, traceId) {
    if (!isInstrumentedFunction(arg)) {
      return arg;
    }

    // pre callback
    const eventListenerRegex = /^on[A-Z]|event/;
    const name = valueCollection._readProperty(arg, 'name');
    const isEventListener = !!(name || '').match(eventListenerRegex);

    // TODO: make sure each `traceId` does not have more than PreCallback update

    const promisifyPromiseVirtualRef = this.runtime.getPromisifyPromiseVirtualRef();
    this.runtime.async.preCallback(traceId, isEventListener, promisifyPromiseVirtualRef);

    // patch callback
    const newArg = this.patchCallback(arg, traceId, promisifyPromiseVirtualRef);
    return newArg || arg;
  }

  monkeyPatchCallee(originalFunction) {
    return getPatchedFunctionOrNull(originalFunction);
  }

  /**
   * Dynamically "monkey-patch-override" a function (if needed).
   * @return the function that will end up getting called instead of originalFunction.
   */
  monkeyPatchArgs(originalFunction, callId, args, spreadArgs = EmptyArray, argTids = EmptyArray) {
    // if (!argTids.length) {
    //   // monkey patching is only necessary for instrumenting callback arguments -> nothing to do
    //   return originalFunction;
    // }
    if (!args) {
      return;
    }
    if (this.ignoreCallbacks.has(originalFunction)) {
      return;
    }

    // NOTE: if callback count is 1, use BCE for scheduler trace
    const instCount = this.checkAndCountInstrumentedCallbacks(originalFunction, args, spreadArgs);
    if (/* !bceStaticTrace.data?.isNew && */
      instCount) {
      // -> monkey patch arguments
      for (let i = 0; i < args.length; i++) {
        // const arg = args[i];
        const argTid = argTids[i];
        if (spreadArgs[i]) {
          // patch spread args
          for (let j = 0; j < spreadArgs[i].length; j++) {
            // TODO: unique traceId per callback (but spreadArgs[i] all share the same trace)
            args[i][j] = this.maybeMonkeyPatchCallback(args[i][j], instCount === 1 ? callId : argTid || callId);
          }
        }
        // patch regular arg
        args[i] = this.maybeMonkeyPatchCallback(args[i], instCount === 1 ? callId : argTid || callId);
      }
      // let f = getPatchedFunctionOrNull(originalFunction);
      // if (!f) {
      //   const calleePatcher = this.defaultCalleePatcher;

      //   f = monkeyPatchFunctionOverride(
      //     originalFunction,
      //     calleePatcher.bind(this, callId)
      //   );
      // }
      // return f;
    }

    // return originalFunction;
  }
}
