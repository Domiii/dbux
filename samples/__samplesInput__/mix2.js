// for (var i = 0; i < 5; ++i) {
//   switch (i) {
//     case 0:
//       console.log(0, i);
//     case 1:
//       console.log(0, i);
//     case 2:
//       console.log(0, i);
//     default:
//       console.log('default', i);
//   }
// }

var y = undefined;
var z = NaN;
var w = Infinity;

class A {
  f() {
    this.x = 3;
    this.y = y;
  }
}

var a = new A();
a.f();
console.log(a.x, a.y, z, w);