/**
 * @file
 */

function main(a, b) {
  a[0] = a[0] * b[2];
  a[1] = a[1] * b[1];
  return a;
}

main([1, 2, 3], [10, 20, 30]);
