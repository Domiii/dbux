/**
 * @file
*/

function main(n, a) {
  let i = n;
  var c = 1;
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
