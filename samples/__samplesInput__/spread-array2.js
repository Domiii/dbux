const o = { f() { return [1,2,3] } };

const a = [
  ...o.f()
];
console.log(a[0]);
