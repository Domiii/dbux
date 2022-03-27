function* f(a) {
  var b = yield a + 1;
  var c = yield a + 2;
  // yield;
  var d = a + 100;

  return [b, c, d];
}

function moveGen(arg, x) {
  console.log(arg, gen.next(x).value);
}

function g(x) {
  moveGen('g', x);
}

function h() { }

let gen;

(function main() {
  gen = f(10);
  moveGen('main', 1);

  g(2);
  h(1);

  moveGen('main', 3);

  g(4);
  h(2);

  console.log('done');
})();

h(3);