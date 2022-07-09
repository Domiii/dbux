function f({ ff = (x) => x }) {
  return ff(3);
}


f({});
