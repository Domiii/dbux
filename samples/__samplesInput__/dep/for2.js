/**
 * @file
 */

function main(n, a) {
  var c = 1;

  for (let i = n; i >= 0; --i) {
    // if (i % 2) {
    c += i * a;
    // }
  }

  return c;
}

main(3, 10);
