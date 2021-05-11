
// FunctionDeclaration
function f() { return f; }

// FunctionExpression
const g = function g() { return g; };
const g2 = function g2() { return g2; };
// const g3 = (null, function g3() { })
class B {
  // NOTE: same as `A::i`; we keep (i) bindings and (ii) function name
  h = (function h() { return this.h; }.bind(this));
}
const p = { 
  // NOTE: same as `o.j`; we keep (i) bindings and (ii) function name (unlike `{ g: () => { } }`!)
  k: (() => (function k() { return this.k; }.bind(this)))
};

// ArrowFunctionExpression
const h = () => { return h; };

// ClassMethod
class A {
  i() { return this.i; }
}

// ObjectMethod
const o = {
  j() { return o.j; }
};

[
  f(),
  g(), new B().h(), p.k(),
  h(),
  new A().i(),
  o.j()
].forEach((res, i) => {
  console.log(i, res.name);
});
