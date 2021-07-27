/**
 * class: computed properties/methods
 */
'use strict';

class A {
  a = 'aa';
  b = 'bb';

  [this.a] = 5;

  // NOTE: `this` cannot be used in computed methods since they are added to prototype, not instance
  // [this.b]() { return this.aa; }
}

console.log(new A().a);

