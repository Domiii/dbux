class A {
  constructor({ x = f() } = {}) {
    this.x = x;
  }
}

console.log(new A().x, '===', 42);

function f() { return 42; }
