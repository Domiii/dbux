/**
 * @file
 * F, G and J indicate asynchronous call graph edges caused by implicitly assumed asynchronous events behind the given line of code.
 * Note that the triggering asynchronous events are actually located on different lines of code.
 * 
 * C(x, y) indicates a chain between runIds x and y
 * F(x, y) indicates a fork between runIds x and y
 * J(...xs) indicates a join between all runs of id x in xs
 */

async function f(x) {
  console.log('f1', x);
  await 0;
  console.log('f2', x);
}

function g(cb, x = 1) {
  console.log('g1', x);
  setTimeout(() => {
    console.log('g2', x);
    cb();
  });
}

function g1(cb) {
  return g(cb, 1);
}

async function chain1() {
  await f(1);
  await f(2);
}

function chain2() {
  return f(1).
    then(() => f(2));
}

function chain3() {
  return new Promise(g1).
    then(() => f(2));
}

async function fork1() {
  f(1);                       // F(1, 2)
  f(2);                       // F(1, 3)
}

async function forkAndChain1() {
  f(1).                       // F(1, 2)
    then(() => f(2));         // C(2, 3)
}

function forkAndChain2() {
  new Promise(g1).  // F(1, 2)
    then(() => f(2));         // C(2, 3)
}

async function forkAndChain3() {
  const p = f(1);   // F(1, 2)
  await f(2);       // C(1, 3)

  return p;         // J(2, 3) — Consumers of the return value implicitly wait for 2 and 3
}

/**
 * Functionally equivalent to forkAndChain3 because p2 will already be resolved before returning.
 */
async function forkAndChain4() {
  const p1 = f(1);   // F(1, 2)
  const p2 = f(2);   // F(1, 3)

  await p2;

  return Promise.all(p1, p2);  // J(2, 3) — Consumers of the return value implicitly wait for 2 and 3
}