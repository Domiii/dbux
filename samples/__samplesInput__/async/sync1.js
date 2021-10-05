/**
 * 3 FORKs: main, f, g
 * 2 SYNCs: f -> main, g -> main
 */

const p = f();
const q = g();

(async function main() {
  await 0;
  console.log('mainA');
  await q;
  console.log('mainB');
  await p;
  console.log('mainC');
  // await 0;
  // console.log('mainD');
})();

async function f() {
  console.log('fA');
  await 0;
  console.log('fB');
  await 1;
  console.log('fC');
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