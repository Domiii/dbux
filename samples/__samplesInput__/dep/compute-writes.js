/**
 * @file
 */

function main(a, b, c) {
  var x = a;
  x += b[0];
  b[1] += x;
  return b;
}

main(-1, [44, 333]);
