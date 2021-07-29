/**
 * class: private properties + methods
 */


class A {
  constructor() { }
  p = 1;
  #q = 2;

  m() { return this.#m2(); }

  #m2() {
    return this.p + this.#q;
  }
}


var a = new A();

console.log(a.p, a.m());