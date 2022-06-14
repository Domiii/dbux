/**
 * @file
 */

function main(a, delta) {
  const tmp = a[0];
  if (delta < 0) {
    delta = a.length + delta - 1; // make it non-negative
  }
  for (let i = a.length - 1; i > 0; --i) {
    // console.log((i + delta) % a.length, i);
    a[(i + delta) % a.length] = a[i] * 3;
  }
  a[delta] = tmp;
  return a;
}

console.log(main([1, 2, 3], -1));
