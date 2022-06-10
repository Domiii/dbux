class A {
  constructor(x) {
    // this.x = x;
  }

  f(x) {
    return x + 33;
  }
}

class B extends A {
  g(y) {
    return /* this.val = */ super.f(y);
    // return this.val * 2;
  }
}

function main(x) {
  const b = new B(1);
  const c = b.g(x);
  // const b = a.x;
  // a.y = b + 3;
  // return [b, c];
  return c;
}

main(5);

