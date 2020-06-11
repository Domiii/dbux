var obj1 = {
  x: 1,
  y: 2
};
var obj2 = {};
var arr1 = ['a', 'b'];
var arr2 = [];

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
  g(obj2, arr2);
}
main();
