/**
 * @file
 */

function main(n, a) {
  var c = 1;

  let i = n;
  for (; ;) {
    // if (i % 2) {
    c += i * a;
    // }
    if (!--i) {
      break;
    }
  }

  return c;
}

main(3, 10);
