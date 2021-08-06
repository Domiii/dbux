/**
 * Promise constructor's resolve() callback triggers an async event IFF not in async/promise queue.
 */

// console.log(1)
// new Promise((r) => {
//   console.log(2);
//   Promise.resolve(1).then(() => { console.log(5); });
//   r();
//   console.log(3);
// }).then(() => {
//   console.log(4);
// });


(async function a1(n = 3) {
  do {
    await new Promise(r => r());
    console.debug('await tick (nested)', n);
  } while (--n);
})();

(async function a2(n = 3) {
  do {
    await 0;
    console.debug('await tick (not nested)', n);
  } while (--n);
})();