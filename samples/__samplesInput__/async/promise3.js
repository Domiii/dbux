(function main() {
  f(1)()
    .then(f(2));
    // .then(f(3));
})();

function f(x) {
  return async () => {
    console.log(`fA`, x);
    await Promise.resolve()
      .then(() => {});
    console.log(`fB`, x);
    // await 0;
    // console.log(`f${x}`, 3);
  };
}