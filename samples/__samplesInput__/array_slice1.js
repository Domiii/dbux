// const a = [1,2,3,4];
// console.log(a[1]);

// var b = a.slice(1, 3); // [2, 3]
// var c = a.slice();
// console.log(a[1], b[0], b, '=== 2 [2, 3]');


function main(a) {
  const b = a.slice(1);
  b[0] = 10;
  return b;
}

console.log(main([1,2,3]));