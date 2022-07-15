"use strict;"

const o = { x: 1 };
({ x } = o).xx;
// (y = 3);
// const { x } = o;
console.log(x);

const gen = g();
while (!({ value } = gen.next()).done) {
  console.log(value);
}

function* g() { yield 1; }
