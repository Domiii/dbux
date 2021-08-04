// import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import isThenable from '@dbux/common/src/util/isThenable';
import { newLogger } from '@dbux/common/src/log/logger';
import { isFunction } from 'lodash';
import valueCollection from '../data/valueCollection';
import { peekBCEMatchCallee } from '../data/dataUtil';
import { monkeyPatchGlobalRaw } from '../util/monkeyPatchUtil';
import executionContextCollection from '../data/executionContextCollection';



// TODO: fix `bind` et al -> need a new identity for functions that goes beyond `refId`
// TODO: add promise<->callback bindings
// TODO: experiment with different types of event<->thread bindings



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
}