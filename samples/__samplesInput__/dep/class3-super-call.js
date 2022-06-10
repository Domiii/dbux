class A {
  x = 100;
  constructor() {
    // this.x = x;
  }

  g(y) {
    return this.x + y;
  }
}

class B extends A {
  g(y) {
    return /* this.val = */ super.g(y);
    // return this.val * 2;
  }
}

function main(x) {
  const b = new B();
  const c = b.g(x);
  // const b = a.x;
  // a.y = b + 3;
  // return [b, c];
  return c;
}

console.log(main(5));

