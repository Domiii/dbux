/**
 * @file getters + setters
 */

const a = 11, b = 12;

const o = {
  get a() { return a; },

  set ['bb'[0]](val) { b = val; },

  f() { return 4; }
};

o.b = 3;
f([o, o.a, b, o.f()]);

function f(arr) {
  console.log(...arr);
}