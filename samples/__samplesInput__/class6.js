/**
 * class: computed properties/methods
 * IMPORTANT: computed class keys are evaluated at **class creation time** (not instance creation time)
 */

var X = 0;
class A {
  1 = 1;
  2 = 2;
  [++X] = 123;

  static [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.name;
  }
}

console.log(new A()[2] + new A()[2]);

/**
 * What is the result?
 * 1. Error
 * 2. 3
 * 3. 4
 * 4. 124
 * 5. 125
 * 6. 246
 * 7. None of the above
 */

console.log(new A(), new A())