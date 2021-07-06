class A {
  f() {
    this.x = 3;
    console.log(this.x);
  }
}

new A().f();