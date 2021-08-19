class A {
  static x = 123;
};
const s = new Set();
s.add(A);

console.log(A.x === 123);
