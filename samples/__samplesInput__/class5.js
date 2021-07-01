
function ff({ o: { p: { a: [x, y] } }, p: { z, w } }) {
  console.log(x, y, z, w);
}

class A {
  // __dbux_class = (() => traceClassMembers(this, [this.f, this.#g]))();
  // static __dbux_class = (() => traceClassStaticMembers(A, [A.sf, A.#sg]))();
  constructor() { console.log('const A'); this.#g(); }
  f() { }
  #g() { }

  static sf() { }
  static #sg() { }
}

class B extends A {
  #__dbux_instance = (() => traceClassMembers(this, [this.fb, this.#gb]))();
  static __dbux_class = (() => traceClassStaticMembers(B, [B.sfb, B.#sgb]))();
  constructor() { super(); console.log('const B', this.__dbux_class); }
  fb() { }
  #gb() { }

  static sfb() { }
  static #sgb() { }
}

function traceClassMembers(obj, members) {
  console.log(members[1]);
  return 'traced';
}

function traceClassStaticMembers(Clazz, members) {
  console.log(members[1]);
}
new B()