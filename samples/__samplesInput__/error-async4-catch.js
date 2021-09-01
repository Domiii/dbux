
async function f() {
  await 0;
  throw new Error('err');
}

async function g() {
  await 0;
  await f();
}

async function h() {
  console.log('h1');
  try {
    await 0;
    await g();
    console.log('h2');
  }
  catch {
    console.error('[h error]');
  }
}

h();
