/**
 * @file
 */

function main(a, x, y) {
  a.push(x, y);
  return [...a];
}

console.log(main([1, 2, 3], 4, 5));
