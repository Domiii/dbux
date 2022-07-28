/**
 * @file
 */

function main(x, y) {
  var c = 1;
  var d = -1;
  var n = 3;

  for (let i = 0; i < n; ++i) {
    c += x;
  }

  for (let i = 0; i < n; ++i) {
    d += y;
  }

  return c + d;
}

main(10, 100);
