Promise.resolve().
  then(f(1));

Promise.resolve().
  then(f(2)).
  then(f(3));


function f(x) {
  return () => {
    console.log('f', x);
    // await 0;
    // console.log(`f${x}`, 3);
  };
}