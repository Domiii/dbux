/**
 * @file Async function async callstack.
 * NOTE: in V8 (as of Summer 2021), the callstack would only go up to `g2` (not even back to `g1`).
 */

async function f() {
  await 0;

  g1();
}

async function g1() {
  await 0;

  g2();
}

async function g2() {
  await 0;

  await h();
}

async function h() {
  await 0;

  throw new Error('errr');
}

f();