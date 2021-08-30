
async function f() {
  await 0;
  throw new Error('err');
}


f();
