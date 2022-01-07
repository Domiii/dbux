/* eslint-disable no-console */
import patchArray from './arrays';
import patchConsole from './console';
import patchFunction from './functions';
import patchObject from './objects';

/** @typedef { import("../RuntimeMonitor").default } RuntimeMonitor */

/**
 * @param {RuntimeMonitor} runtimeMonitor 
 */
export default function initPatchBuiltins(runtimeMonitor) {
  patchConsole(runtimeMonitor);
  patchObject(runtimeMonitor);
  patchArray(runtimeMonitor);
  patchFunction(runtimeMonitor);
  patchOther(runtimeMonitor);

  /**
   * @see https://stackoverflow.com/a/35813135
   */
  if (globalThis.process?.release?.name === 'node') {
    // -> deal with system-dependent things dynamically
    // eslint-disable-next-line global-require
    const nodeBuiltins = require('./node');
    if (!nodeBuiltins.tryPatchNode) {
      // extra precaution: we had a bug where we tryPatchNode was not found for some reason
      throw new Error(`could not resolve "nodeBuiltins.tryPatchNode", but found: ${JSON.stringify(
        Object.keys(Object.assign({}, nodeBuiltins)) // little hackfix to get keys of built-in objects
      )} `);
    }

    nodeBuiltins.tryPatchNode(runtimeMonitor);
  }
}

/**
 * @param {RuntimeMonitor} runtimeMonitor 
 */
function patchOther(runtimeMonitor) {
  Error.captureStackTrace && runtimeMonitor.callbackPatcher.addCallbackIgnoreFunction(Error.captureStackTrace);
}