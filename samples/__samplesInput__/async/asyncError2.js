/**
 * Async errors will throw on all `await`s.
 */

var p;

// const sleep = async (ms) => new Promise(r => setTimeout(r, ms));

async function f() {
  console.log('f1');
  await h();
  console.log('f2');
}

async function g() {
  console.log('g1');
  await 0;
  console.log('g2');
}

async function h() {
  console.log('h1');
  await i();
  console.log('h2');
}

async function i() {
  console.log('i1');
  await 0;
  console.log('i2');
  throw new Error('err');
}

f();
g();