class A {
  f({ ff = (x) => x }) {
    return ff(3);
  }
}


new A().f({});
