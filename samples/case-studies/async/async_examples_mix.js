import { f, g, f1, f2, f3, g1, g2 } from './_common';

// Given asynchronous function f and g:

// Ex. 1: f and g execute in parallel threads
(async function () {
  f(1);                  // F(0, 1)
  f(2);                  // 
})();

// Ex. 2: all runs f and g execute in serial, in the same thread
(async function () {
  await f(1);
  await f(2);
})();

// Ex. 3: equivalent to Ex. 2
(async function () {
  const pf = f(1);
  await pf;
  const pg = f(2);
  await pg;
})();

// Ex. 4: equivalent to Ex. 2, 3
(async function () {
  const p = f(1);
  await p.then(() => f(2));
})();

// Ex. 5: equivalent to Ex. 2, 3, 4
//        (but with a return value)
(function () {
  const p = f(1);
  return p.then(() => f(2));
})();

// Ex. 6: equivalent to Ex. 2, 3, 4, 5
//        (but with an additional function call)
(async function () {
  async function ff() {
    await f();
    await g();
  }

  await ff();
})();

/**
 * Ex. 7:
 * 
 * Missing `await`s in front of ff() and fff() lead
 * to all calls of f executing in parallel.
 */
(async function () {
  async function ff() {
    await f(1);           // F(0, 1)
  }

  async function fff() {
    ff();
    await f(2);           // F(0, 2)
  }

  fff();
  await f(3);             // C(0, 3)
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
 * 2 -- 3
 * 4 -- 5
 * 
 * Changing `fff()` to `await fff()` would change the graph to:
 *
 * 1
 * 2 -- 3 -- 4 -- 5
 */
(async function () {
  async function ff() {
    f(1);
    await f(2);           // C(0, 2)
  }

  async function fff() {
    await ff();           // [ignored]
    await f(3);           // C(2, 3)
  }

  async function ffff() {
    fff();
    await f(4);           // C(0, 4)
  }

  await ffff();           // [ignored]
  await f(5);             // C(4, 5)
})();