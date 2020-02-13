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