/**
 * class: computed properties/methods
 * IMPORTANT: computed class keys are evaluated at **class creation time** (not instance creation time)
 */

var X = 0;
class A {
  static ['a' + ++X]() {
    return 'a1';
  }
  static ['a' + ++X]() {
    return 'a2';
  }
}

var o = new A();
console.log(o, o.a1, o.a2);
