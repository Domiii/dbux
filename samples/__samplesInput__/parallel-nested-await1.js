/**
 * @file 
 */

/**
 * 
 */
async function f(x) {
  console.log('f1', x);
  // await g();
  await 0;   // 2x FORK: [1->2], [1->3]
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

(async () => {
  console.log('main1');
  f(1);
  console.log('main2');
  f(2);
  console.log('main3');
})();
