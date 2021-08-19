'use strict';
/**
 * Strict + branches + hoisting.
 */

function f(a) {
  var y = 123;
  if (a) {
    var x = 1;
  }
  else {
    var x = 2;
  }
  console.log(x);
}


f(true);
f(false);