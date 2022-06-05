function main(a = [1, 2, 3]) {
  var x, y;
  ([x, y] = a);

  return [y, x];
}

main();
