Promise.resolve()
  .then(ff(1))
  .then(g);

// Promise.resolve().
//   then(f(2)).
//   then(f(3));

function g() { }

function ff(x) {
  return async function f() {
    console.log(`fA`, x);
    await 0;
    console.log(`fB`, x);
    await 1;
    console.log(`fC`, x);
  };
}