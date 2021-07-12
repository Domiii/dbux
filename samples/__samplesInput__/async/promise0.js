let p = Promise.resolve().
  then(f(1));

p.then(f(2)).
  then(f(3));

p.then(f(4)).
  then(f(5));


async function f(x) {
  console.log(`f${x}`, 1);
  await 0;
  console.log(`f${x}`, 2);
  // await 0;
  // console.log(`f${x}`, 3);
}