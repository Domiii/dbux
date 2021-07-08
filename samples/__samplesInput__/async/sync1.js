/**
 * Old promise.
 */

(function main() {
  const p = f();
  await p;
  await g(1, p);
  await g(2, p);
})();

async function f() {
  console.log('fA');
  await 0;
  console.log('fB');
}

async function g(x, p) {
  console.log('gA', x);
  await p;
  console.log('gB', x);
}