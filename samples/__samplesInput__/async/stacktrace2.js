/**
 * @file Async function async callstack.
 * NOTE: in V8 (as of Summer 2021):
 * * Error callstack would not go back up the promise chain.
 * * reject does not have any callstack.
 */

Promise.resolve()
  .then(() => { })
  .then(() => f());

function f() {
  return Promise.resolve().then(() => {
    throw new Error(123);
  });
}

setTimeout(() =>
  Promise.resolve()
    .then(() => { })
    .then(() =>
      Promise.resolve().then(() => {
        Promise.reject(456);
      })
    )
);
