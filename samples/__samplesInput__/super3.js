class A { x = 3; }
class B extends A {
  f() {
    const p = Object.getPrototypeOf(this.constructor.prototype);
    super['x'] = 3;
    p.y = 4;
    console.log(
      super.x,
      this.x,
      super.y,
      this.y
    );
  }
}
new B().f(); // 'undefined 3 4 4'