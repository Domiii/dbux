/**
 * @file
 * 
 * `super()` and `super.f()` are `CallExpression`s that need special attention.
 */

class A {
  constructor(a) {
    this.a = a;
  }

  f(x) { 
    console.log('f(x)', x);
  }

  // o = {
  //   g(y) {
  //     console.log('g(y)', y);
  //   }
  // }
}

class B extends A {
  constructor() {
    super('b');
    /**
     * replace: (null, BCE, super())
     */
  }

  f(x) {
    // super.f(x);
    /**
     * replace: (o = this, f = super.f, BCE, f(x))
     */

    // super.o.g(y); -> NOTE: this does not seem possible
  }
}

function main() {
  const b = new B();
  b.f(1);
}

main();
