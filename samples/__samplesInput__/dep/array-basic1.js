/**
 * @file
 */

function main(a, b) {
  a[0] = a[0] * b;
  a[1] = a[1] * b;
  return a;
}

main([1, 2, 3], -1);
