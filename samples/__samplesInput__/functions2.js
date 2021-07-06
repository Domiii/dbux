
// const g3 = (null, function g3() { })
class B {
  // NOTE: same as `A::i`; we keep (i) bindings and (ii) function name
  h = (function h() { return this.h; }.bind(this));
}
const p = { 
  // NOTE: same as `o.j`; we keep (i) bindings and (ii) function name (unlike `{ g: () => { } }`!)
  k: (() => (function k() { return this.k; }.bind(this)))
};

// ClassMethod
class A {
  i() { return this.i; }
}

// ObjectMethod
const o = {
  j() { return o.j; }
};

[
  new B().h(),
  p.k(),
  new A().i(),
  o.j()
].forEach((res, i) => {
  console.log(i, res.name);
});
