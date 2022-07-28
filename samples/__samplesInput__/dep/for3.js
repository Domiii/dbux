/**
 * @file
 */

function main(x, y) {
  var a = [0];
  var b = [0];
  var n = 3;
  // var n = 2;

  for (let i = 0; i < n; ++i) {
    a[i] = (a[i - 1] || 0) + x;
  }

  return [...a];
}

main(10, 100);
