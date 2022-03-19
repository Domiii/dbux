/**
 * @file
 * global EventTarget
 */

import { peekBCEMatchCallee } from '../data/dataUtil';
import { monkeyPatchMethod } from '../util/monkeyPatchUtil';

/** @typedef { import("./RuntimeMonitor").default } RuntimeMonitor */

// future-work: keep things clean → don't arbitrarily add globals like this.
/**
 * @type {Array.<Map.<EventTarget, Map.<string, Map.<Function, Set.<Function>>>>>}
 */
const eventHandlersByCaptureByTargetByTypeByCb = [new Map(), new Map()];

/**
 * Get set of registered event handlers by { capture, eventTarget, type, originalCb }.
 * 
 * @return {Set.<Function>}
 */
function getOrCreateEventHandlersOfCb(capture, eventTarget, type, originalCb) {
  // let originalCb = getOriginalCallback(cb);
  // if (!originalCb) {
  //   // if (!isMonkeyPatchedCallback(cb)) {
  //   // }
  //   // the CB was not monkey patched (e.g. due to `dbux disable` etc.)
  //   originalCb = cb;
  // }
  const captureIndex = capture + 0;
  let eventHandlersByTypeByCb = eventHandlersByCaptureByTargetByTypeByCb[captureIndex].get(eventTarget);
  if (!eventHandlersByTypeByCb) {
    eventHandlersByCaptureByTargetByTypeByCb[captureIndex].set(eventTarget, eventHandlersByTypeByCb = new Map());
  }
  let eventHandlersByCb = eventHandlersByTypeByCb.get(type);
  if (!eventHandlersByCb) {
    eventHandlersByTypeByCb.set(type, eventHandlersByCb = new Map());
  }
  let eventHandlers = eventHandlersByCb.get(originalCb);
  if (!eventHandlers) {
    eventHandlersByCb.set(originalCb, eventHandlers = new Set());
  }
  return eventHandlers;
}

function isBoolean(val) {
  return val === false || val === true;
}

function isCapture(optionsOrIsCapture) {
  return isBoolean(optionsOrIsCapture) ? optionsOrIsCapture : !!optionsOrIsCapture?.capture;
}

/**
 * @param {RuntimeMonitor} runtimeMonitor 
 */
export default function patchEventTarget(runtimeMonitor) {
  if (typeof EventTarget === 'undefined') {
    // NOTE: EventTarget was only added rather recently, so not all platforms (e.g. older Node versions) have it.
    return;
  }

  // → keep identity for repeated event listener add/remove invocations

  monkeyPatchMethod(EventTarget, 'addEventListener',
    (thisArg, args, originalFunction, patchedFunction) => {
      const [type, originalCb, options] = args;
      const bceTrace = peekBCEMatchCallee(patchedFunction);
      const argTids = bceTrace?.data?.argTids;
      if (!argTids) {
        return originalFunction.apply(thisArg, args);
      }
      const callId = bceTrace.traceId;

      /**
       * NOTE: "If a listener is registered twice, one with the capture flag set and one without."
       * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
       */
      const capture = isCapture(options);

      // TODO: cb is not patched here, yet.
      const patchedCb = runtimeMonitor.callbackPatcher.maybeMonkeyPatchCallback(originalCb, callId, argTids[1]);

      const patchedCbs = getOrCreateEventHandlersOfCb(capture, thisArg, type, originalCb);
      patchedCbs.add(patchedCb);
      return originalFunction.call(thisArg, type, patchedCb, options);
    }
  );

  monkeyPatchMethod(EventTarget, 'removeEventListener',
    (thisArg, args, originalFunction, patchedFunction) => {
      const bceTrace = peekBCEMatchCallee(patchedFunction);
      const argTids = bceTrace?.data?.argTids;
      if (!argTids) {
        originalFunction.apply(thisArg, args);
        return;
      }

      /**
       * NOTE: "If a listener is registered twice, one with the capture flag set and one without."
       * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
       */
      const [type, originalCb, options] = args;
      const capture = isCapture(options);
      const patchedCbs = getOrCreateEventHandlersOfCb(capture, thisArg, type, originalCb);

      // NOTE: `removeEventListener` has no return value
      for (const patchedCb of patchedCbs) {
        originalFunction.call(thisArg, type, patchedCb, options);
      }
    }
  );
}
