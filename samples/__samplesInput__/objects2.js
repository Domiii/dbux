// large object

var obj1 = {
  x: 1,
  y: 2
};
var obj2 = {};
var arr1 = ['a', 'b'];
var obj3 = {};
var longString = 'a'.repeat(1000);

obj2.a = 3;
obj2['b'] = 4;

for (let i = 0; i < 100; i++) {
  obj3['prop' + i] = i;
}

obj3[longString] = longString;

function f(x) {
  console.log(x);
}
function g(...objs) {
  for (const obj of objs) {
    f(obj);
  }
}
function main() {
  g(obj1);
  g(arr1);
  g(obj1, arr1);
  g(obj2);
  g(obj3);
}
main();
