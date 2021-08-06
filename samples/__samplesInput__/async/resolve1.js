async function f() {
  console.log(1);
  await 0;
  await p();
}

function p() {
  const p = new Promise((resolve) =>
    Promise
      .resolve(123)
      // .then(resolve)
    .then(() => resolve(123))
  )
  p.then(async (a) => {
    console.log(2, a, a === 123);
    await 0;
    console.log(3);
    await 1;
  });

  return p;
}

f();
