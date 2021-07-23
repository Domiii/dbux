Promise.resolve()
  .then(f(11))
  .then(f(12));

Promise.resolve()
  .then(f(21))
  .then(f(22));


function f(x) {
  return () => {
    console.log('f', x);
  };
}