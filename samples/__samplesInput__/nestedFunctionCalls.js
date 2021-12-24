function f(x) {
  return x + 1;
}

function g(x) {
  return x * 2;
}

function h() {
  return 100;
}

console.log(f(g(h())));