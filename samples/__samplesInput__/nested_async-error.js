async function f() {
  await 0;
  await g();
}

async function g() {
  await 0;
  await h();
}

async function h() {
  await 0;
  throw new Error('OUCH');
}

f();