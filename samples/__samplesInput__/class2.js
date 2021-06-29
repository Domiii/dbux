class A {
  constructor() { }
  #q = g();
  p = f(this.#q);

  change() {
    this.#q = 3;
    return this.#q;
  }
}


var a = new A();

console.log(a.p, a.change());

function g() { return 1; }
function f(x) { console.log('f', x); return 2; }
