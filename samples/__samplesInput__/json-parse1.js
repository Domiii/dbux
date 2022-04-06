var a = JSON.parse('[{"x":{"a":1,"b":2,"o":{"aa":[{"x":1},{"y":2}]}}},{"x":{"c":3,"d":4}}]');

var b = a[0];
var c = a[1];

console.log(a[0], b, a);
console.log(c);