// polymorphic constructors require special attention

class A {
  /**
   * @bug https://github.com/Domiii/dbux/issues/428
   * NOTE: preset-env will automatically insert a ctor (a new, yet uninstrumented staticContext) and assign `f` in that.
   *        If not handled well, Dbux would assume that `f` belongs to B.constructor (or, if that does not exist, the context that calls the ctor).
   */
  f = () => {
    console.log('f');
  }
}

class B {
  constructor() {
    this.x = 1;
  }
}

new B();