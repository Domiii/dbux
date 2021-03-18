
// FunctionDeclaration
function f() { return f; };

// FunctionExpression
const g = function g() { return g; };
const g2 = function g2() { return g2; };
// const g3 = (null, function g3() { })
class B {
  // NOTE: same as `A::i`; we keep (i) bindings and (ii) function name
  g = (function g() { return this.g; }.bind(this));
}
const p = { 
  // NOTE: same as `o.j`; we keep (i) bindings and (ii) function name (unlike `{ g: () => { } }`!)
  g: (() => (function g() { return this.g; }.bind(this)))
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
  g(), new B().g(), p.g(),
  h(),
  new A().i(),
  o.j()
].forEach((res, i) => {
  console.log(i, res.name);
});
