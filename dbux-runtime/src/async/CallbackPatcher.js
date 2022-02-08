// import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import isThenable from '@dbux/common/src/util/isThenable';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import { isInstrumentedFunction, getFirstContextAfterTrace } from '../data/dataUtil';
// eslint-disable-next-line max-len
import { getOriginalCallback, getOriginalFunction, getPatchedCallback, getPatchedFunction, getPatchedFunctionOrNull, isMonkeyPatchedCallback, isMonkeyPatchedFunction, isOrHasMonkeyPatchedFunction, _registerMonkeyPatchedCallback, _registerMonkeyPatchedFunction } from '../util/monkeyPatchUtil';
// import executionContextCollection from '../data/executionContextCollection';
import executionContextCollection from '../data/executionContextCollection';
import traceCollection from '../data/traceCollection';
import valueCollection from '../data/valueCollection';


/**
 * TODO: make configurable
 */
const Enabled = true;

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

  isMonkeyPatchedCallback = isMonkeyPatchedCallback;
  getOriginalCallback = getOriginalCallback;

  isMonkeyPatchedFunction = isMonkeyPatchedFunction;
  getOriginalFunction = getOriginalFunction;

  isPatched(arg) {
    return !!this.getOriginal(arg);
  }

  hasPatched(arg) {
    return !!this.getPatched(arg);
  }

  getOriginal(arg) {
    return getOriginalCallback(arg) || getOriginalFunction(arg);
  }

  getPatched(arg) {
    return getPatchedFunction(arg) || getPatchedCallback(arg);
  }

  // ###########################################################################
  // ctor + init
  // ###########################################################################

  constructor(_runtimeMonitorInstance) {
    this._runtimeMonitorInstance = _runtimeMonitorInstance;

    // this.patchSetTimeout();
  }


  init() { }

  /** ###########################################################################
   * {@link #patchCallback}
   * ##########################################################################*/

  addCallbackIgnoreFunction(originalFunction) {
    // TODO: fix this mess... should not just be on ignore for callbacks?!
    this.ignoreCallbacks.add(originalFunction);
  }

  /**
   * Dynamic callback patcher.
   */
  patchCallback(originalCallback, callId, schedulerTraceId, promisifyPromiseVirtualRef) {
    const { runtime } = this;

    if (isMonkeyPatchedCallback(originalCallback)) {
      const argOrig = getOriginalCallback(originalCallback);
      trace(`callback argument already patched - ${argOrig.name} (${argOrig.toString().replace(/\s+/g, ' ').substring(0, 30)}) -\n  scheduler=`,
        traceCollection.makeTraceInfo(schedulerTraceId));
      return originalCallback;
    }

    let f = getPatchedCallback(originalCallback);
    if (f) {
      return f;
      // const calleePatcher = this.defaultCalleePatcher;
      // f = monkeyPatchFunctionOverride(
      //   originalFunction,
      //   calleePatcher.bind(this, callId)
      // );
    }

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

    // [edit-after-send]
    const bceTrace = traceCollection.getById(callId);
    if (bceTrace) {
      bceTrace.data = bceTrace.data || {};
      bceTrace.data.patchedCallbacks = bceTrace.data.patchedCallbacks || [];
      const ref = valueCollection.getRefByValue(originalCallback);
      bceTrace.data.patchedCallbacks.push({
        ref: ref?.refId,
        name: valueCollection._readProperty(originalCallback, 'name'),
        schedulerTraceId
      });
    }
    else {
      // NOTE: this should never happen!?
    }

    return patchedCallback;
  }

  /**
   * Check call arguments for instrumentation.
   * @param {*} args  
   */
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

  maybeMonkeyPatchCallback(arg, callId, traceId) {
    if (!isInstrumentedFunction(arg)) {
      return arg;
    }

    // pre callback
    const eventListenerRegex = /^on[A-Z]|event/;
    const name = valueCollection._readProperty(arg, 'name');
    const isEventListener = !!(name || '').match(eventListenerRegex);

    // TODO: make sure each `traceId` does not have more than 1 PreCallback update

    const promisifyPromiseVirtualRef = this.runtime.getPromisifyPromiseVirtualRef();
    this.runtime.async.preCallback(traceId, isEventListener, promisifyPromiseVirtualRef);

    // patch callback
    const newArg = this.patchCallback(arg, callId, traceId, promisifyPromiseVirtualRef);
    return newArg || arg;
  }

  monkeyPatchCallee(originalFunction) {
    if (!Enabled) {
      return null;
    }
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
    if (!Enabled || !args) {
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
            args[i][j] = this.maybeMonkeyPatchCallback(args[i][j], callId, instCount === 1 ? callId : argTid || callId);
          }
        }
        // patch regular arg
        args[i] = this.maybeMonkeyPatchCallback(args[i], callId, instCount === 1 ? callId : argTid || callId);
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
