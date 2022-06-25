/**
 * @file
 */

function main(a, x, y) {
  a.push(x, y);
  const b = [...a];
  return b;
}

console.log(main([1, 2, 3], 4, 5));
