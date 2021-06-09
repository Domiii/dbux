var x = 3;
const o = {};
o.b = {};
o.b.c = x;
var a = o.b;
// var x = 3;
// // o.b.c = x;
// console.log(a.c);
// o.b[f('c')] = 4;
console.log(o, o.b, x);

// function f(x) {
//   return x;
// }
