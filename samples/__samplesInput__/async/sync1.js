/**
 * Two FORKs: 
 * * 1 for main
 * * 1 for f
 */

(async function main() {
  const p = f();
  const q = g();
  // const p = 0;
  // await 0;
  // await p;
  console.log('mainA');
  await p;
  console.log('mainB');
  await 0;
  console.log('mainC');
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
  await 0;
  console.log('gB', x);
  await 0;
  console.log('gC', x);
}