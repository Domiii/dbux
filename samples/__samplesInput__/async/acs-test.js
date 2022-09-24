async function f() {
  await 0;
  await 1;
  await 2;
  debugger;
}

async function g() {
  await 0;
  Promise.resolve()
    .then(() => {
      return Promise.resolve()
        .then(() => {
          // this is not on the stack, but maybe it should be
          return Promise.resolve();
        });
    })
    .then(() => { f(); });
  await 2;
}

setTimeout(g);