class A {
  constructor({ x = f(), y = x } = {}) {
    this.x = x;
    this.y = y;
  }
}

console.log(new A().x, '===', new A().y, '===', 42);

function f() { return 42; }
