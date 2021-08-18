function A() {
  this.a = this.f(1);
  console.log('a', this.a)
}
function B() {
  A.call(this);
}

require('util').inherits(B, A);



A.prototype.f = function (x) {
  console.log('f', x);
  return x * 10;
}

const b = new B();
console.log(b.a, '=== 10', b.f === A.prototype.f, b instanceof A, b instanceof B, B);