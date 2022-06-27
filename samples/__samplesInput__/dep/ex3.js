/**
 * @file
 */

function main(n, x, a) {
  var c = 0;

  for (let i = 0; i < n; ++i) {
    c += i * x + a;
  }

  return c;
}

main(3, 2, 10);
