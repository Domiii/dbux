/**
 * 3 FORKs: main, f, g
 */

const p = f();

(async function main() {
  await 0;
  console.log('mainA');
  await p;
  console.log('mainB');
  // await 0;
  // console.log('mainD');
})();

async function f() {
  console.log('fA');
  await 0;
  console.log('fB');
  await 1;
  console.log('fC');
  await 2;
  console.log('fD');
}