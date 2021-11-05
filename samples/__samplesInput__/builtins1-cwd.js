/**
 * The problem tested here is that when @dbux/runtime 
 * reads the stack trace for any root context, node internally accesses certain
 * functions, such as `process.cwd`. That can cause unwanted distortions.
 * 
 * @file sample based on `grace-fs` -> `polyfill.js`
 */

var origCwd = process.cwd
var cwd = null

process.cwd = function () {
  console.trace();
  if (!cwd)
    cwd = origCwd.call(process)
  return cwd
}

function cb() {}

setTimeout(cb);
