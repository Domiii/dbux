/**
 * @file
 */

function main(a) {
  var c;
  if (a > 10) {
    c = a / 3;
  }
  else {
    c = a * 3;
  }

  if (a < 10) {
    c += 100;
  }
  else {
    c -= 100;
  }

  console.log('c', c);

  return c;
}

main(2);
