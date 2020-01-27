import { logInternalError } from '../log/logger';

/**
 * This file contains some utilities and definitions to run code, independent of environment.
 * 
 * @file
 */

function universalLib(globalName, fallbackCb) {
  if (globalName in globalThis) {
    return globalThis[globalName];
  }
  try {
    return fallbackCb();
  }
  catch (err) {
    // logInternalError(`could not load library ${globalName}`, err);
    throw new Error(`could not load library ${globalName} --\n  ${err}`);
  }
}

export default {
  get performance() {
    return universalLib('performance', () => {
      // hope for node or node-like environment
      const { performance: performanceNode } = import('perf_hooks');
      return performanceNode;
    });
  }
};