Promise.resolve().
  then(f(1));

Promise.resolve().
  then(f(2)).
  then(f(3));


async function f(x) {
  console.log(`fA`, x);
  await 0;
  console.log(`fB`, x);
  await 0;
  console.log(`fC`, x);
  // await 0;
  // console.log(`f${x}`, 3);
}