function* f(x) {
  yield x + 1;

  return x + 2;
}

const gen = f(10);
console.log(gen.next().value);

setTimeout(() => {
  // this will pop `f`, but CGR is different from it's push
  console.log(gen.next().value);
})
