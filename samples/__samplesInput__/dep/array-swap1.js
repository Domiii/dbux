function main(a) {
  const j = 0;
  const b = [a[j], a[j + 1]];
  ([a[j + 1], a[j]] = b);
  // a[j + 1] = b[0];
  // a[j] = b[1];

  return [...a];
}

console.log(main([1, 2, 3]));
