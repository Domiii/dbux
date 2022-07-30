function main(x) {
  var a = [0], n = 2;
  for (let i = 0; i < n; ++i) {
    a[i] = (a[i - 1] || 0) + x;
  }
  return [...a];
}
main(10, 100);
