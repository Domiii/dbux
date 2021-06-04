function f1(a, b) {
  console.log('f1', a, b);
  return a + b;
}

function f2(g = f1(1, 2)) {
  console.log('f2', g);
}

f2();