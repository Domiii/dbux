
const o = { f() { return 3; } };
const b = o.f();

if (b) {
  console.log(true, b);
}
else {
  console.log(false);
}

var i = 0;
switch (i) {
  case 0:
    console.log(0, i);
  case 1:
    console.log(0, i);
  case 2:
    console.log(0, i);
  default:
    console.log('default', i);
}

console.log(i ? 1 : 0);
console.log(!i ? 1 : 0);


var a = (1, 2, 3);
console.log(a);