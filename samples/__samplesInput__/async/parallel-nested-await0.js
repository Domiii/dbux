/**
 * @file parallel-nested-await0.js
 * `fB` and `gB` execute in the same "physical run" (requires inserting "virtual runs").
 */

async function f() { 
  console.log('fA');
  await 0;
  console.log('fB');
}

async function g() {
  console.log('gA');
  await 0;
  console.log('gB');
}

f();
g();