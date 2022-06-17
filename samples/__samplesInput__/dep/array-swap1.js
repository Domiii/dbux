function main(a) {
  const j = 0;
  // ([a[j + 1]] = a);
  // const b = [a[j], a[j + 1]];
  // ([a[j + 1], a[j]] = a);
  a[0] = a[1];
  // a[j + 1] = b[0];
  // a[j] = b[1];

  // return [...a];
  return a;
}

console.log(main([[1, 2], [3, 4]]));
// console.log(main([1, 2]));
