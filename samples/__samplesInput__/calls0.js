f();

var a = 1, b = undefined;
g(a, b);

function f(a, b) {
  return 1 + a + b;
}

function g(a, b) {
  return a + b;
}
