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
 * Export some globals usually available in browser environments.
 * If not available, will try to load it using a (usually node-specific) callback.
 */

/**
 * Custom require function to make webpack "happy".
 */
// eslint-disable-next-line no-eval
const _r = eval(`
 (typeof __non_webpack_require__ !== 'undefined' && __non_webpack_require__ || require)
`);

/**
 * @example `universalLibs.performance.now()`
 */
export const performance = universalLib('performance', () => {
  const { performance: performanceNodeJs } = _r('perf_hooks');
  return performanceNodeJs;
});


// const inspectOptions = { depth: 0, colors: true };
//   function _inspect(arg) {
//   const f = typeof window !== 'undefined' && window.inspect ? window.inspect : require('util').inspect;
//   return f(arg, inspectOptions);
// }