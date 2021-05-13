
var a = [];
function run(n = 1e6) {
  for (let i = 0; i < N; ++i) {
    a.push(i);
  }
}

function f() {
  run();
  g();
}

function g() {
  run();
}