/**
 * @file Links `arguments`'s valueId to real argument dataNodes
 */

function f(a = 1) {
  // NOTE: `arguments` captures only what was passed to function. Ignores default parameters.
  var x = arguments;
  console.log(x[0]);
  console.log(x[1]);
  console.log(x[5]);
  var y = arguments;
}

function g() { return 'hi'; }

f(1, 'x', g, ...[3, 4, 5]);
