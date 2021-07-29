/**
 * class: private properties
 */

class A {
  #x = 0;
  constructor(x) {
    this.#x = x;
  }

  f() {
    return this.#x;
  }
}

class B extends A {
  constructor() {
    var x = 3;
    super(x);
  }

  f() { return super.f(); }
}


new B().f();