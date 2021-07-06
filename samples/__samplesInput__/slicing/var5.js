let x = 1;
const y = 2;
// const y = x + 3;

function f(/* x */) {
  let y;
  y = 'yy';
  x = 111;
  return y + x + 5;
}

console.log(x, y, f(x));