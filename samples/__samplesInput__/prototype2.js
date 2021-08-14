function A() {
  this.a = this.f(1);
}

A.prototype.f = function(x) {
  console.log('f', x);
  return x * 10;
}

console.log(new A().a, '=== 10');