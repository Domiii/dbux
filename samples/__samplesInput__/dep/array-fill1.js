function main(b) {
  const a = Array(1);
  a.fill(b);

  const c = [];
  a.forEach((x, i) => {
    c[i] = x;
  });
  return c;
}

console.log(main(5));
// console.log(main([1, 2]));
