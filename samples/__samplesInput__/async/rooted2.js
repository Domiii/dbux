/**
 * "Rooting" or "chaining to root" means that a promise (created in the current run) fulfills either of the two conditions:
 * 
 * * awaited at the root level
 * * returned from a `then` callback
 */

// ########################################
// 
// ########################################

(async function ap() {
  console.log('ap', 1);
  await Promise.resolve()
    .then(p('ap', 2));
  console.log('ap', 3);
  await Promise.resolve()
    .then(f.bind(null, 'ap', 4))
    .then(() => p('ap', 5)())
    .then(p('ap', 6));
  console.log('ap', 7);
})();

// ########################################
// 
// ########################################

(function pa() {
  return Promise.resolve()
    .then(f.bind(null, 'pa', 1))
    .then(() => f('pa', 2))
    .then(() => p('pa', 3))
    .then(f.bind(null, 'pa', 4));
})();

// ########################################
// 
// ########################################


async function f(...x) {
  console.log('f1', x);
  await 0;
  console.log('f2', x);
  await 0;
  console.log('f3', x);
}

function p(...x) {
  return () => Promise.resolve(console.log('p1', x))
    .then(() => console.log('p2', x));
}