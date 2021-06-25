var x = 1;
let o = {};
o.b = {};
o = {};
o.b = {};
o.b.c = x;
o.b.c += 10;
o.b['c'] += 100;
var a = o.b;
// var x = 3;
// // o.b.c = x;
// console.log(a.c);
// o.b[f('c')] = 4;
console.log(o);
console.log(o.b);
console.log(o.b.c);

// function f(x) {
//   return x;
// }