class A { x = 3; }
class B extends A {
  f() { return ++super.x; }
  g() { return super.x++; }
}
new B().f();
new B().g();