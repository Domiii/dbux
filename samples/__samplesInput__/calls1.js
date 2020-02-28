function main() {
  const c = add(1, 2);
  const d = mul(
    add(c, 3),
    add(5, mul(6, [7, 8].reduce((a, x) => a + x)))
  );
  console.log(
    add(d, - 100),
    [100, 20, 33, 4, 5, 6, 7].reduce((a, x) => Math.min(a, x))
  );
}

function add(a, b) {
  return a + b;
}

function mul(a, b) {
  return a * b;
}

debugger
main();
