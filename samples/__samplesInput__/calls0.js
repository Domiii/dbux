f();

var a = 1, b = 2;
g(a, b);

function f() {
  console.log('f');
}

function g(a, b) {
  console.log('g', a, b);
}