class A { x = 3; }
class B extends A {
  f() {
    console.log(
      Object.getPrototypeOf(this.constructor.prototype).constructor.name,
      super.constructor.name,
      Object.getPrototypeOf(this.constructor.prototype).constructor === super.constructor
    );
  }
}
new B().f();  // 'A A true'