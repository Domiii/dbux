/**
 * @file
 * bug: this summarization is somewhat inadequate due to a[0] (see notes in `summarizeDfs`)
 */

function main(x, y) {
  var a = [0];
  var b = [0];
  // var n = 3;
  var n = 2;

  for (let i = 1; i < n; ++i) {
    a[i] = a[i - 1] + x;
  }

  // for (let i = 1; i < n; ++i) {
  //   b[i] = b[i - 1] + y;
  // }

  return [...a, ...b];
}

main(10, 100);
