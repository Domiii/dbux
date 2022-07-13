class A {
  constructor(x = {}) {
    this.x = x;
  }
}

console.log(new A().x);

function f() { return 42; }
