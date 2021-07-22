let p = Promise.resolve()
  .then(f(1));

p.then(f(2))
  .then(f(4));

p.then(f(3))
  .then(f(5));


function f(x) {
  return async () => {
    console.log(`fA`, x);
    await 1;
    console.log(`fB`, x);
    // await 0;
    // console.log(`f${x}`, 3);
  };
}