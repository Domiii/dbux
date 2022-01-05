/**
 * @file
 */

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(() => { }, ms)
  );
}

(async function f() {
  console.log(1);
  await sleep(100);
  console.log(2);
  await sleep(200);
  console.log(3);
  await sleep(300);
  console.log(4);
})();

// f(0);

// for (let i = 0; i < 2; ++i) {
//   f(i);
// }