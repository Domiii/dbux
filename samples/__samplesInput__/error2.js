
function f() {
  throw new Error('err');
}

function g() {
  console.log('g1');
  f();
  console.log('g2');
}

g();
