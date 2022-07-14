function f({
  a = 1,
  b = a
}) {
  console.log(a, b);
}

f({});
