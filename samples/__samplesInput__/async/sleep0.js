/**
 * @file repeat sleep for huge async graph
 */
async function sleep(ms) {
  return new Promise((r) => {
    setTimeout(r, ms);
  })
}

// temporarily disabled due to broken promise instrumentation
// async function f(i) {
//   console.log(i, 'a');
//   await sleep((i % 10) * 100);
//   console.log(i, 'b');
//   await sleep((i % 10) * 100);
//   console.log(i, 'c');
//   await sleep((i % 10) * 100);
//   console.log(i, 'd');
// }

async function f(i) {
  console.log(i, 'a');
  await 1;
  console.log(i, 'b');
  await 2;
  console.log(i, 'c');
  await 3;
  console.log(i, 'd');
}

for (let i = 0; i < 10; ++i) {
  f(i);
}