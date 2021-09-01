
async function f() {
  await 0;
  throw new Error('err');
}

async function g() {
  await 0;
  await f();
}

g();
