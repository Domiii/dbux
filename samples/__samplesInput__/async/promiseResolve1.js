function f() {
  console.log(1);
  new Promise((resolve) =>
    Promise
      .resolve()
      .then(() => resolve(123))
  )
    .then(async (a) => {
      console.log(2, a, a === 123);
      await 0;
      console.log(3);
    });
}

f();
