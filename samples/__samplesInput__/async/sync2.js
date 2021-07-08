/**
 * New promise.
 * Because it goes first, g(1) makes `p` part of it's thread.
 * g(2) then synchronizes against `p`.
 */

const p = f();

g(1, p);
g(2, p);

async function f() {
  console.log('fA');
  await 0;
  console.log('fB');
  await 0;
  console.log('fC');
}

async function g(x, p) {
  console.log('gA', x);
  await p;
  console.log('gB', x);
  await 0;
  console.log('gC', x);
}