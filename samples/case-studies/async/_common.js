/**
 * @file
 * F, G and J indicate asynchronous call graph edges caused by implicitly assumed asynchronous events behind the given line of code.
 * Note that the triggering asynchronous events are actually located on different lines of code.
 *
 * C(x, y) indicates a chain between runIds x and y
 * F(x, y) indicates a fork between runIds x and y
 * J(...xs) indicates a join between all runs of id x in xs
 */

export async function sleep(ms) { 
  return new Promise(r => setTimeout(r, ms));
}

export async function f(x) {
  console.log('f1', x);
  await 0;
  console.log('f2', x);
}

export function g(cb, x = 1) {
  console.log('g1', x);
  setTimeout(() => {
    console.log('g2', x);
    cb();
  });
}

export function f1() { return f(1); }
export function f2() { return f(2); }
export function f3() { return f(3); }
export function g1(cb) { return g(cb, 1); }
export function g2(cb) { return g(cb, 2); }