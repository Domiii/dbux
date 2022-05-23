function add(a, b) {
  return a + b;
}

function mul(a, b) {
  return a * b;
}

function main(a = 1, b = 2) {
  var c = add(a, 10);
  var d = mul(b, 20);

  return add(b, mul(c, d));
}

main();
