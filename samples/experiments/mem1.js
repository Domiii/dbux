/**
 * @file Simple Node memory + GC test.
 * Test results: Node does not leak memory when using generator functions.
 * When observing memory consumption of the process, it keeps going up until `f()` has finished and `gc()` is called, after which it goes down again.
 */

const N = 200e6;

var s = ''.padStart(N, ' ');

function g(a) {
  a.push(''.padStart(N, 'l') + 'x');

  // NOTE: random access into the string actually allocates it
  console.log(a.map(s => s[N/2] + s.length).join(', '));
}

function* f() {
  var a = [];
  yield;
  g(a);
  yield;
  g(a);
  yield;
  g(a);
  yield;
  g(a);
  yield;
  g(a);
}

(async function() {
  for (x of f()) {
    await new Promise(r => setTimeout(r, 1000));
  }
  global.gc();
  for (x of f()) {
    await new Promise(r => setTimeout(r, 1000));
  }
})();