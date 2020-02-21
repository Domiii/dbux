
identity(...[-1, 0]);
const f = identity;
const g = identity;

f();
g(1, 2);
call(() => console.log(3));
call(f.bind(null, 4), 5);

function identity(...x) {
  console.log(...x);
  return x;
}

function call(f, x = null) {
  f();
  x && console.log(x);
}
