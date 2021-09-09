console.log(Function.prototype.toString.call(Object.defineProperty))

console.log(Object.defineProperty)

var o = {};
console.log(Object.defineProperty(o, 'x', { value: 1 }));
console.log('done', o.x);
