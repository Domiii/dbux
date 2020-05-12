const z = g();

function g() { }

const o = {
  f() { },
  b: {
    c: 1,
    g() { }
  }
};

const y = o.f();
o.b.g();
