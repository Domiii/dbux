var o = {};
o.a = 1;
++o.a;

function f(...args) {
  console.log(...args);
}

// o.b = o.a;
// ++o.b;
// o.b++;

// var q = { c: 33 };
// --q.c;
// q.c--;

// f(o.a, o.b, q.c, `(=== 2 4 31)`);
