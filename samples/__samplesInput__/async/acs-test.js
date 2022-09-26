async function f() {
  await 0;
  await 1;
  await 2;
}

async function g() {
  await 0;
  Promise.resolve()
    .then(() => {
      return Promise.resolve()
        .then(function fff() {
          debugger;
          return Promise.resolve();
        });
    })
    .then(() => { f(); });
  await 2;
}

setTimeout(g);