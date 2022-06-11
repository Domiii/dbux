function main(a) {
  var b = [];
  a.forEach((x, i) => {
    b[i] = x;
  });
  return b;
}

console.log(main([[1], [2], [3]]));
// console.log(main([1, 2]));
