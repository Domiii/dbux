const o = {};

function add(a, b) {
  return a + b;
}

Object.defineProperty(o, 'x', {
  get() {
    return add(3, 4);
  }
})

console.log(o.x);