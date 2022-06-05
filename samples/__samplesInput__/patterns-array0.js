function main(a) {
  const j = 0;
  ([a[j + 1], a[j]] = [a[j], a[j + 1]]);

  return [...a];
}

console.log(main([1, 2, 3]));
