/**
 * class: private properties + methods + static methods
 */


class A {
  constructor() { }
  p = 1;
  #q = 2;

  m() { return this.#m2(); }

  #m2() {
    return this.p + this.#q;
  }

  static s() {
    return A.#t();
  }

  static #t() {
    return 123;
  }
}


var a = new A();

console.log(a.p, a.m(), A.s());