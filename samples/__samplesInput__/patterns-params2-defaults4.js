function g() { return 42; }

class A {
  // f({ x = g() }) {
  //   return x + 3;
  // }
  f({ before, after } = {}) {
  }
}


new A().f({});
