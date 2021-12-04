function f(x, y) {
  return x + y + 2;
};

var g = () => console.log('g!');

console.log(f(1, 2), g());
