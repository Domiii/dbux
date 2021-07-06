const o = {
  a: {
    o2: {
      x: 1,
      y: 2
    }
  }
};

const {
  a: {
    o2: {
      x,
      y
    }
  }
} = o;
console.log(x, y);

function ff({ o: { p: { a: [x, y] } }, p: { z, w } }) {
  console.log(x, y, z, w);
}