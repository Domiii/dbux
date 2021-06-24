var x = 3;
let y = x;
x = 5;
console.log(y);

let o = {};
o.b = {};
o.b.c = x;
o = {};
o.b = {};
console.log(o);
o.b.c = { d: 1 };
var a = o.b;
console.log(o, o.b, a);
