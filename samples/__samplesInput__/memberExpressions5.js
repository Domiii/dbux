/**
 * @file goto write node or value creation of external object
 */

var x = 2;
let o = createObject();
o.b = x;
console.log(o);

function createObject() {
  // dbux disable
  return { a: 1 };
}