/**
 * 
 */

const p = f();

(async function main() {
  await 0;
  console.log('mainA');
  await g();
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
}

async function g() {
  await 0;
}