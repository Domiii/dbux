// import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import isThenable from '@dbux/common/src/util/isThenable';
import { newLogger } from '@dbux/common/src/log/logger';
import { isFunction } from 'lodash';
import valueCollection from '../data/valueCollection';
import { peekBCEMatchCallee, peekContextCheckCallee } from '../data/dataUtil';
import { monkeyPatchGlobalRaw } from '../util/monkeyPatchUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug: _debug, warn, error: logError } = newLogger('patchPromise');

/** @typedef {import('../RuntimeMonitor').default} RuntimeMonitor */

export default class CallbackPatcher {
  /**
   * @type {RuntimeMonitor}
   */
  _runtimeMonitorInstance;

  // ###########################################################################
  // init
  // ###########################################################################

  init(_runtimeMonitorInstance) {
    this._runtimeMonitorInstance = _runtimeMonitorInstance;

    this.patchSetTimeout();
  }

  // ###########################################################################
  // cb
  // ###########################################################################

  patchSetTimeoutCallback(cb, bceTrace) {
    if (!isFunction(cb)) {
      // not a cb
      return cb;
    }
    if (!valueCollection.getRefByValue(cb)) {
      // not instrumented
      return cb;
    }

    const originalCb = cb;

    // TODO

    return function patchedPromiseCb(...args) {
      let returnValue;
      try {
        // actually call `then` callback
        returnValue = originalCb(...args);
      }
      finally {
        // set async function's returnValue promise (used to set AsyncEventUpdate.promiseId)
        const cbContext = peekContextCheckCallee(originalCb);
        // console.trace('thenCb', cbContext?.contextId, getPromiseId(returnValue));
        cbContext && this._runtimeMonitorInstance._runtime.async.setAsyncContextPromise(cbContext.contextId, returnValue);

        // TODO: assume FORK by default
        // TODO: check for CHAIN if resolve/reject was called within the callback root
        // TODO: what if resolve/reject was called in a nested setTimeout call?
        //    -> consider CHAIN by default for nested async callbacks?
        //    -> offer UI button to toggle
        //    -> render (lack of) error propagation in async graph

        this._runtimeMonitorInstance.runtime.async.postCallback(thenRef, previousResult, returnValue);
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
        if (!bceTrace) {
          // call was not instrumented
          return originalSetTimeout(cb, delayMs);
        }

        cb = this.patchSetTimeoutCallback(cb, bceTrace);
        const timer = originalSetTimeout.call(cb, delayMs, ...args);
        
        const schedulerTraceId = bceTrace.traceId;
        this._runtimeMonitorInstance.runtime.async.preCallback(TODO);

        return timer;
      }
    );
  }
}