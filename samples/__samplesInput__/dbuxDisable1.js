/** */

function R() {}

/** dbux disable */
R.prototype.end = function (fn) {
  var self = this;
}


function A() {
  /** dbux disable */
  var req = this.f();
}
A.prototype.f = function f() {
  console.log('A.f');
}

new A();