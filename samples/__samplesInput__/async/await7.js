function sync() {
  f();
}

async function async() {
  console.log('async1');
  await f();
  console.log('async2');
  await f();
  console.log('async3');
}

function f() {
  console.log('f');
  g();
}

function g() {
  console.log('g');
}

sync();
async();