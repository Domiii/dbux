function* f(x) {
  yield x + 1;
  yield x + 2;
  // yield x + 3;
  // yield;
  // return 123;
}

const gen = f(10);
console.log(gen.next().value);
console.log(gen.next().value);
console.log(gen.next().value);
// console.log(gen.next().value);
// console.log(gen.next().value);