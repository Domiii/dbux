/**
 * @file recursive assignment
 */

var x = 3;

let o = {};
o.b = {};
o.b.c = x;
o = {};
o.b = {};
console.log(o);
o.b.c = { d: 1 };
var a = o.b;
console.log(o, o.b, a);



callbacks.compareCallback = callbacks.compareCallback || undefined;
callbacks.visitingCallback = callbacks.visitingCallback || stubCallback;
