function main(a) {
  const j = 0;
  const b = [a[j], a[j + 1]];
  ([a[j + 1], a[j]] = b);

  return [...a];
}

console.log(main([1, 2, 3]));
