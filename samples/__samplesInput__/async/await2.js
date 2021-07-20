// async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function f(x) {
  console.log('f1', x);
  await 0;
  console.log('f2', x);
  // await 1;
  // console.log('f3', x);
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

(async () => {
  console.log('main1');
  f(1);
  console.log('main2');
  // var p = f(2);
  // await p;
  await f(2);
  console.log('main3');
  // var p2 = f(3);
  // await p2;
  // console.log('main4');
})();
