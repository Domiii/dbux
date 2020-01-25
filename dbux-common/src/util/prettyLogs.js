/**
 * TODO: use something that works in browser as well as in Node (currently only works properly in Node)
 */

import colors from 'colors/safe';


const inspectOptions = { depth: 0, colors: true };
function _inspect(arg) {
  const f = typeof window !== 'undefined' && window.inspect ? window.inspect : require('util').inspect;
  return f(arg, inspectOptions);
}


/**
 * @see https://gist.github.com/RReverser/0a7caa89b465d1ed0c96
 */
export function makePrettyLog(origLog, customColor) {
  const colorize = colors[customColor];
  origLog = origLog.bind(console);
  return function customLogger(...args) {
    return origLog(
      ...args.map(
        arg => (arg && arg.constructor === String) ? 
          colorize(arg) : 
          // _inspect(arg)
          arg
      )
    );
  };  
}

console.log = makePrettyLog(console.log, 'white');
console.error = makePrettyLog(console.error, 'red');
console.warn = makePrettyLog(console.warn, 'yellow');
console.debug = makePrettyLog(console.debug, 'gray');