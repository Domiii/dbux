function f(x) {
  g(x, 1);
  g(x, 2);

  return 'f' + x;
}

function g(x, y) {
  return 'g' + x + y;
}

function h(x) {
  console.log('h', x);
  return 'h' + x;
}

setTimeout(() => h(1));
setTimeout(() => h(2));

f(1);
f(2);
