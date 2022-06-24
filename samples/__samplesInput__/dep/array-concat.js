
function main(a, b, c, d) {
  return a.concat(b, c, d);
}

console.log(main([1, 2, 3], 4, [5, 6], [['7array'], 8]));

main2([1, 2, 3]);

function main2(a) {
  const x = [a[0], a[1]];
  return x;
}
