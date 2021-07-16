/**
 * "Rooting" or "chaining to root" means that a promise (created in the current run) fulfills either of the two conditions:
 * 
 * * awaited at the root level
 * * returned from a `then` callback
 */

// ########################################
// 
// ########################################

(async function aa() {
  console.log('aa', 1);
  await f(1);
  console.log('aa', 2);
  await f(2);
  console.log('aa', 3);
})();

// ########################################
// 
// ########################################

(function pp() {
  return Promise.resolve()
    .then(p(1))
    .then(() => p(2)())
    .then(p(3));
})();

// ########################################
// 
// ########################################


async function f(x) {
  console.log('f1', x);
  await 0;
  console.log('f2', x);
  await 0;
  console.log('f3', x);
}

function p(x) {
  return () => Promise.resolve(console.log('p1', x))
    .then(() => console.log('p2', x));
}