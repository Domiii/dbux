class A {
  constructor() { }
  #q = 1;
  p = this.#q;

  change() {
    ++this.#q;
    return this.#q;
  }
}


var a = new A();

console.log(a.p, a.change());
