/**
 * @see https://github.com/Domiii/dbux/issues/545
 * @file
 */

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function f() {
  await g();
  await sleep(50);
  for (let i = 0; i < 2; ++i) {
    await g();
  }
  await g();
}

async function g() {
  await 0;
  await sleep(300); // TODO: randomize delay etc.
}

for (let i = 0; i < 3; ++i) {
  f();
}