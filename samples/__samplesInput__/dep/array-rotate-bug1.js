/**
 * @file
 */

function main(a, delta) {
  const tmp = a[(a.length - delta) % a.length];
  for (let i = 1; i < a.length; ++i) {
    a[i] = a[(i - delta + a.length) % a.length];
  }
  a[0] = tmp;
  return a;
}

console.log(main([1, 2, 3, 4, 5], 1));
