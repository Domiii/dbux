function add(a, b) {
  return a + b;
}

function mul(a, b) {
  return a * b;
}

var x = 1;

console.log(
  mul(add(10, mul(2 + x, 3)), 4)
);