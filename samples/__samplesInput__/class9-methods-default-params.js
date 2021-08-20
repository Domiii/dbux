class A {
  f({ x } = { x: 3 }) {
    console.log(x);
  }
}

var a = new A();

a.f();
a.f({ x: 44 })