import { f, g, f1, f2, f3, g1, g2 } from './_common';

// Given asynchronous function f and g:

// Ex. 1: f and g execute in parallel threads
(async function () {
  f();
  g();
})();

// Ex. 2: all runs f and g execute in serial, in the same thread
(async function () {
  await f();
  await g();
})();

// Ex. 3: equivalent to Ex. 2
(async function () {
  const pf = f();
  await pf;
  const pg = g();
  await pg();
})();

// Ex. 4: equivalent to Ex. 2, 3
(async function () {
  const p = f();
  await p.then(g);
})();

// Ex. 5: equivalent to Ex. 2, 3, 4
(function () {
  const p = f();
  return p.then(g);
})();

// Ex. 6: equivalent to Ex. 2, 3, 4, 5 (but with an additional function call)
(function () {
  async function ff() {
    await f();
    await g();
  }

  await ff();
})();

/**
 * Ex. 7:
 * 
 * A missing `await` in front of fff() leads to a forked thread for any
 * meaning f(1) and f(2) execute in parallel.
 */
(async function () {
  async function ff() {
    await f(1);
  }

  async function fff() {
    ff();
    await f(2);
  }

  fff();
  await f(3);
})();

/**
 * Ex. 8:
 * 
 * First, f(1), f(2) and f(4) run in parallel.
 * f(2) is followed by f(3).
 * f(4) is followed by f(5).
 * 
 * Simple visualization of asynchronous graph:
 * 
 * 1
 * 2 -> 3
 * 4 -> 5
 */
(async function () {
  async function ff() {
    f(1);
    await f(2);
  }

  async function fff() {
    await ff();
    await f(3);
  }

  async function ffff() {
    fff();
    await f(4);
  }

  await ffff();
  await f(5);
})();