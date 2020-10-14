statements;
f();
statements;
g(h());
statements;

function f() {
  statements;
  f2();
  statements;
}
function f2() {
  statements;
}
function g(x) {
  statements;
}
function h() {
  return expression();
}