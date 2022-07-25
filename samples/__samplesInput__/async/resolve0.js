async function f() {
  console.log(1);
  await 0;
  await p();
}

function p() {
  const p = new Promise((resolve) =>
    setTimeout(() => resolve(), 1000)
    // setTimeout(resolve, 1000)
  )
  p.then(async (a) => {
    console.log(2);
    await 0;
    console.log(3);
    await 1;
  });

  return p;
}

f();
