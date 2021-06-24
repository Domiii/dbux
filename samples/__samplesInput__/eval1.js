g();

function g() {
  eval('f(3)');
}

function f(x) {
  console.log('f', x);
}