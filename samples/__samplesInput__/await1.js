// async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function f(x) {
  console.log('f1', x);
  // await g();
  await 0;
  // console.log('f2');
  // await g();
  console.log('f2', x);
}


// async function g() {
//   console.log('g1');
//   h();
//   // await 0;
//   // await h();
//   console.log('g2');
// }

// async function h() {
//   console.log('h1');
//   await 0;
//   console.log('h2');
// }

f(1);
f(2);
