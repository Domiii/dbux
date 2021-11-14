/* eslint no-console: 0 */
import isString from 'lodash/isString';

/**
 * TODO: use something that works in browser as well as in Node (currently only works properly in Node)
 */

import colors from 'colors/safe';


// const inspectOptions = { depth: 0, colors: true };
// function _inspect(arg) {
//   const f = typeof window !== 'undefined' && window.inspect ? window.inspect : require('util').inspect;
//   return f(arg, inspectOptions);
// }


/**
 * @see https://gist.github.com/RReverser/0a7caa89b465d1ed0c96
 */
export function makePrettyLog(origLog, customColor) {
  const colorize = colors[customColor];
  origLog = origLog.bind(console);
  return function customLogger(...args) {
    return origLog(
      ...args.map(
        arg => (arg && (arg.constructor === String || arg instanceof Error)) ? 
          colorize(err2String(arg)) :
          // _inspect(arg)
          arg
      )
    );
  };  
}

/**
 * TODO: don't add color, if not supported
 * consider `process.stderr.isTTY`
 */

console.log = makePrettyLog(console.log, 'white');
console._error = console.error;  // keep the original around
console.error = makePrettyLog(console.error, 'red');
console.warn = makePrettyLog(console.warn, 'yellow');
console.debug = makePrettyLog(console.debug, 'gray');



/** ###########################################################################
 * util
 * ##########################################################################*/

// eslint-disable-next-line no-inner-declarations
function err2String(err) {
  if (Array.isArray(err?.stack)) {
    /**
     * stack is array of `CallSite`
     */
    return `${err.message}\n    ${err.stack.map(callSite2String).join('\n    ')}`;
  }
  return isString(err?.stack) && err.stack.includes(err.message) ? err.stack : err.toString();
}

/**
 * @see https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules__types_node_globals_d_.nodejs.callsite.html
 * @see https://github.com/dougwilson/nodejs-depd/blob/master/index.js#L267
 */
function callSite2String(callSite) {
  let file = callSite.getFileName() || '<anonymous>';
  const line = callSite.getLineNumber();
  const col = callSite.getColumnNumber();

  if (callSite.isEval()) {
    file = callSite.getEvalOrigin() + ', ' + file;
  }

  // site.callSite = callSite;
  const fname = callSite.getFunctionName();

  return `at ${fname} (${file}:${line}:${col})`;
}
