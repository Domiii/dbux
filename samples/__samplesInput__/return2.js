/**
 * Nested combinations between:
 * 0. Function
 * 1. CallExpression
 * 2. Arithmetic expressions
 * 3. ReturnArgument
 */

function nothing() { return; }
function nothing2() { }

var a = nothing();
var b = nothing2();

// complex1();

// function f(x, ...args) {
//   console.log(x, ...args);
// }

// function g(x) {
//   return x + 1;
// }

// function h(x, y) {
//   return g(x * y);
// }


// function i(x, y) {
//   return g(x * y) - g(x + y);
// }

// function j(x, y) {
//   return (z) => x + y + z;
// }


// f(g(1), g(2));
// h(g(3), g(4));
// i(5, 6);
// j(7, 8)(9);
