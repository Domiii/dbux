/**
 * @file Async function async callstack.
 * NOTE: in V8 (as of Summer 2021), callstack depth = 1.
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

  return h();
}

async function h() {
  await 0;

  throw new Error('errr');
}

f();
