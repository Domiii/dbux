function f(a, b, c) {
  console.log(a, b, c);
}

var a = 1;
++a;
var b = a;
var c = typeof a;
a++;
--a;
a--;

f(a, b, c);
