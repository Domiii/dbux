function f(x) {
  console.log('f', x);
}

function F(x) {
  console.log('F', x);

  x + x;

  f(x + 1);
  f(x + 2);
  f(x + 3);
}

(function main() {
  F(10);
  F(20);
})();