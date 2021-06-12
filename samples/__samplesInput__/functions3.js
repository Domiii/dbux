/**
 * NOTE: `ObjectMethod` observes the same semantics as `FunctionExpression`.
 * 
 * @see https://eslint.org/docs/rules/object-shorthand
 */

function f() { console.log(...arguments); }
class A {
  o = {
    g() { f('g', this); },
    h: function () { f('h', this); }
  };
}

var o = new A().o;
o.g();
o['g']();
var g = o.g;
g()

o.h();
o['h']();
var h = o.h;
h()