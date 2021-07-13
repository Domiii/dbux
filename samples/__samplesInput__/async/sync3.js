/**
 * Four FORKs: `f` is its own FORK + one FORK per `g`.
 * All `g`s SYNC against `f`.
 */

const p = f();

(function main() {
  console.log('mainA');
  const p = f();
  await 0;
  console.log('mainB');
  g(1, p);
  g(2, p);
  g(3, p);
})();

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