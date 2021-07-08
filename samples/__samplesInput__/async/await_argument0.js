
3+4;

let a = 4, b = 5, c = async () => {};

async function f() {
  await 42;
  await g();
  await a;
  await (a + b);
  await c;
  await c();
}

f();
function g() {};