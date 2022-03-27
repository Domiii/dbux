function* f(x) {
  yield x + 1;
  yield x + 2;
  // yield;
  // return 123;
}

function g() {}

const gen = f(10);
console.log(gen.next().value);

g(1);

console.log(gen.next().value);
console.log(gen.next().value);
// console.log(gen.next().value);
// console.log(gen.next().value);

g(2);

console.log('done');