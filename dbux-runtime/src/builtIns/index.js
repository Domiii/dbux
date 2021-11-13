/* eslint-disable no-console */
import { monkeyPatchFunctionHolderDefault } from '../util/monkeyPatchUtil';
import patchArray from './arrays';
import patchFunction from './functions';
import tryPatchNode from './node';
import patchObject from './objects';

/** @typedef { import("../RuntimeMonitor").default } RuntimeMonitor */

/**
 * @param {RuntimeMonitor} runtimeMonitor 
 */
export default function initPatchBuiltins(runtimeMonitor) {
  if (globalThis.console) {
    for (const key of Object.keys(console)) {
      if (console[key] instanceof Function) {
        monkeyPatchFunctionHolderDefault(console, key);
      }
    }
  }

  patchObject(runtimeMonitor);
  patchArray(runtimeMonitor);
  patchFunction(runtimeMonitor);
  tryPatchNode(runtimeMonitor);
  patchOther(runtimeMonitor);
}

/**
 * @param {RuntimeMonitor} runtimeMonitor 
 */
function patchOther(runtimeMonitor) {
  Error.captureStackTrace && runtimeMonitor.callbackPatcher.addCallbackIgnoreFunction(Error.captureStackTrace);
}