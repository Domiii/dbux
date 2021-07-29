/**
 * class: computed properties/methods
 */

class A {
  constructor() {
    // console.log('A.constructor');
  }

  f() {
    // console.log('A.f');
  }
}

class B extends A {
  constructor() {
    // console.log('B.constructor');
    super();
  }

  f() {
    // console.log('B.f');
    super.f.call(this);
  }
}

new B().f();