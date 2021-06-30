var a = 'a';
var b = 'b';

var o = {};
o[a] = 11;
o[b] = 12;

var p = {
  [a]: 21,
  [b]: 22
}

console.log(o.a, o.b, p[a], p[b]);