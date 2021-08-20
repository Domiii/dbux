function f(a = 3, b) {
  console.log(a, b);
}

function g(a = [], b) {
  console.log(a, b);
}

f();
f(undefined, undefined);
g(101, 102);