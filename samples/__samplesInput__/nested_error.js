function f() {
  g();
}

function g() {
  h();
}

function h() {
  throw new Error('An error');
}

f();