/**
 * @file reassignment/deletion of object properties
 */

let o = { a: 'oa' };

console.log(o);

o.a = 'new oa';

console.log(o);

o.b = 'ob';

console.log(o);

delete o.a;

o.c = { a: 'oca' };

console.log(o);;