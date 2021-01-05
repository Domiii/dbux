/**
 * @file Double async await, 
 */

async function f() {
  await g();
}

async function g() {
  await 0;
}

f();