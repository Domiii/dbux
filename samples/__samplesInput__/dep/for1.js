/**
 * @file
 */

function main(n, a) {
  var c = 1;

  for (let i = 0; i < n; ++i) {
    // if (i % 2) {
    c += i * a;
    // c += a;
    // }
  }

  return c;
}

main(1, 10);
