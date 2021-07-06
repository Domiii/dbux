(function f(n) {
  console.log('f', n);
  n && f(--n);
})(3)