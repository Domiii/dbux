class A {
  constructor() { }
  p = f();
  #p2 = g();
  // m = function m() { return this.p; }.bind(this)
  m() { return this.p; }
  #m2() { }
}


var a = new A();

console.log(a.p, a.m());

function f() { return 5; }
function g() { return 6; }