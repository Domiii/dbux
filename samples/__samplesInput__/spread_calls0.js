function f(a, b, c, d, e) {
  console.log(a, b, c, d, e);
}

var a = [1, 2];
var b = 3+5;
var c = [6];

f(...a, b, ...c);
