/**
 * class: computed properties/methods
 */

var X = 0;
var b = null;
class B { constructor() { console.log('new B()'); } x = ++X; }
class A {
  x = ++X;

  // IMPORTANT: computed class keys are evaluated at **class creation time** (not instance creation time)
  [(console.log('new B().x'), new B().x)] = 123;
  [++X] = 456;
}

console.log(new A(), new A())