/**
 * Async errors will throw on all `await`s.
 */

var p;

const sleep = async (ms) => new Promise(r => setTimeout(r, ms));

async function f() {
  return p = g();
}

async function f2() {
  await p;
}

async function g() {
  console.log(new Error('err'));
  await sleep(100);
  throw new Error('err');
}

sleep(1000);
f2();
f();