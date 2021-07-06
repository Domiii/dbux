const a = 11, b = 12;

const o = { 
  'a': 0,
  ['x']: 1,
  y: 2,
  z() {
    return 3;
  },
  ['w']() {
    return 4;
  },
  a,
  bb: b
};

f([o, o.x, o.y, o.z(), o.w()]);

function f(arr) {
  console.log(...arr);
  console.log(arr[0], arr[1]);
}