/**
 * Some edge cases for patterns (mostly parameter-related).
 */

/** ###########################################################################
 * Parameter default values
 * ##########################################################################*/

function f() { console.log('f'); return { a: 1, b: 2 }; }

function g({ a, ...r = 111 } = (x = f())) {
  var x;
  console.log('x:', x, 'a:', a, 'r:', r);
}
g()

/** ###########################################################################
 * Recursive function expressions
 * ##########################################################################*/

function g({ a, b, c = (function h(i) { if (!i) return 'h'; console.log('h', i); return h(i - 1); })(3) }) {
  var x;
  console.log('x:', x, 'a:', a, 'c:', c);
}

g({})


/** ###########################################################################
 * Nested `AssignmentPattern`(in `params`)
 * ##########################################################################*/

function f({ x = 1 } = o) { }
