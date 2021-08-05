/**
 * @file getters + setters
 */

const a = 11, b = 12;

const o = {
  get a() { return a; },

  get ['bb'[0]]() { return b; }
};

f([o, o.a, o.b]);

function f(arr) {
  console.log(...arr);
}