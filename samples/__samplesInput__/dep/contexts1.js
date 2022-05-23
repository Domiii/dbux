function add(a, b) {
  return a + b;
}

function mul(a, b) {
  return a * b;
}

function main(a = 1, b = 2) {
  var c = add(a, b);

  return add(c, mul(a, b));
}

main();
