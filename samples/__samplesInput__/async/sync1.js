/**
 * Two FORKs: 
 * * 1 for main
 * * 1 for f
 */

(async function main() {
  const p = f();
  // const p = 0;
  // await 0;
  // await p;
  await g(1, p);
  await g(2, p);
  await g(3, p);
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