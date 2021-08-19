'use strict';
/**
 * Re-declaring parameter with var.
 */

function f(a) {
  var a = 4;
  console.log(a);
}

function g(b = 123) {
  var b = 5;
  console.log(b);
}

f(1);
g();