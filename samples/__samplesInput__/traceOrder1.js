/**
 * Verify order of `staticTraceId` of nested combinations between:
 * 0. Function
 * 1. CallExpression
 * 2. Arithmetic expressions
 * 3. ReturnArgument
 */


function h(x, y) {
  return g(x * y);
}

function f(x, ...args) {
  console.log(x, ...args);
}

function g(x) {
  return x + 1;
}


function i(x, y) {
  return g(x * y) - g(x + y);
}

function j(x, y) {
  return (z) => x + y + z;
}

f(g(1), g(2));
h(g(3), g(4));
i(5, 6);
j(7, 8)(9);