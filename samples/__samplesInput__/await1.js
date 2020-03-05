async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function f() {
  console.log('f1');
  await g();
  console.log('f2');
  await g();
  console.log('f3');
}

async function g() {
  console.log('g1');
  h();
  h();
  console.log('g2');
}

async function h() {
  console.log('h1');
  await sleep(100);
  console.log('h2');
}

f();
