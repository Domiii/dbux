const AA = class A {
  constructor(x) {
    console.log('new A');
    this.x = x;
  }

  f() {
    this.a = new A(this.x + 1);
  }
}

var a = new AA(1);
a.f();

console.log(a.x, a.a.x);