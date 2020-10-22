
function add(a, b) {
  return a + b;
}

const a = {
  get x() {
    return add(1, 2);
  },

  set x(val) {
    this._x = val;
  }
};
console.log(a.x, a.y);

a.x = 3;