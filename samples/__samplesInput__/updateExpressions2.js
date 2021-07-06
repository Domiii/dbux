function f(a, b, c) {
  console.log(a, b, c);
}

var o = { a: 1 };
++o.a;
o.b = o.a;
++o.b;
o.b++;

var q = { c: 33 };
--q.c;
q.c--;

f(o.a, o.b, q.c);
