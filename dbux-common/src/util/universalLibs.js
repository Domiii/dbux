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

/**
 * @see https://stackoverflow.com/a/35813135
 */
export function isEnvNode() {
  return (typeof process !== 'undefined') && (process.release?.name === 'node');
}

/**
 * Exports some globals usually aware in browser environments.
 * If not available, will try to load it otherwise.
 */
export default {
  /**
   * usage: `universalLibs.performance.now()`
   */
  get performance() {
    return universalLib('performance', () => {
      // hope for node or node-like environment
      const { performance: performanceNodeJs } = eval("import('perf_hooks')");
      return performanceNodeJs;
    });
  }


// const inspectOptions = { depth: 0, colors: true };
//   function _inspect(arg) {
//   const f = typeof window !== 'undefined' && window.inspect ? window.inspect : require('util').inspect;
//   return f(arg, inspectOptions);
// }
};