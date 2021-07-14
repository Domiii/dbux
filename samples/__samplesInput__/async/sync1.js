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
  await q;
  console.log('mainC');
  await 0;
  console.log('mainD');
})();

async function f() {
  console.log('fA');
  await 0;
  console.log('fB');
}

async function g(x, p) {
  console.log('gA', x);
  await 0;
  console.log('gB', x);
  await 1;
  console.log('gC', x);
  await 2;
  console.log('gD', x);
}