var o = { x: 1, y: 2 };
var arr = ['a', 'b'];

o.x = 111;
arr[0] = 'aaa';

var o2 = { arr, o };

console.log(o, arr, o2);
