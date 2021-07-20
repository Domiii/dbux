var N = 12;
var iHeartbeat = 0;
(async function background() {
  while (iHeartbeat < N) {
    console.log('heartbeat', iHeartbeat++);
    await 0;
  }
})();

// ########################################
// f
// ########################################

Promise.resolve()
  .then(f(1))
  .then(() => {
    return Promise.resolve(
      () => Promise.resolve(
        () => Promise.resolve()
      )
    )
      .then(f(2));
  })
  .then(f(3));

// ########################################
// g
// ########################################

Promise.resolve()
  .then(g(1))
  .then(() => Promise.resolve()
    .then(() => {
      return Promise.resolve(
        () => Promise.resolve(
          () => Promise.resolve()
        )
      )
        .then(g(2));
    })
  )
  .then(g(3));

// ########################################
// util
// ########################################

function f(x) {
  return () => console.log('f', x);
}

function g(x) {
  return () => console.log('g', x);
}