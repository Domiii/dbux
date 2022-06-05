function main(a = [1, 2, 3]) {
  const j = 1;

  // [a[j]] = a;
  [a[j], a[j + 1]] = [a[j + 1], a[j]];

  console.log(a);
}

main();