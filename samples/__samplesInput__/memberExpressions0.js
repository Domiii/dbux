const o = {};
o.b = {};
o.b.c = 3;
o.b[f('c')] = 4;
console.log(o.b.c);

function f(x) {
  return x;
}
