/**
 * @file Objects with initial value
 */

let a = 1;
let o = { a, a1234567890123456789: 2 };

o.o = { aa: a, bb: 2 };

console.log(o, o.o, o.o.bb);