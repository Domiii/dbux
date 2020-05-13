
function add(a, b) {
  return a + b;
}

const a = {
  get x() {
    return add(1, 2);
  }
};
console.log(a.x, a.y);