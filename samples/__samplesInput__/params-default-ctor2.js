class A {
  constructor({ x = f() } = {}) {
    this.x = x;
  }
}

console.log(new A().x);

function f() { return 42; }
