import colors from 'colors/safe';
import { inspect } from 'util';

function doInspect(arg) {
  return inspect(arg, { depth: 1, colors: true });
}


function overrideLog(origLog, customColor) {
  const colorize = colors[customColor];
  return function customLogger(...args) {
    return origLog(...args.map(arg => (arg && arg.constructor === String) ? 
        colorize(arg) : 
        doInspect(arg)
      )
    );
  };  
}

/**
 * @see https://gist.github.com/RReverser/0a7caa89b465d1ed0c96
 */
console.log = (function (log) {
  return function () {
    return log.apply(this, Array.prototype.map.call(arguments, function (arg) {
      return doInspect(arg);
    }));
  };
})(console.log);
console.error = overrideLog(console.error, 'red');
console.warn = overrideLog(console.warn, 'yellow');
console.debug = overrideLog(console.debug, 'gray');