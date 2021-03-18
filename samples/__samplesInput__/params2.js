function g() { }

// NOTE: g() cannot be instrumented (for now)
function f(x = g()) {
  x2 = g();
  console.log(x);
}


class A {
  // NOTE: g() cannot be instrumented (for now)
  _update(x = g()) {
    x2 = g();
    console.log(x);
  }
}

f();
new A()._update();