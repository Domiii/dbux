/**
 * `bind`, `apply` and `call` are native wrappers around functions.
 * We need to make sure:
 * 1. the underlying function gets the correct input and output `DataNode` linkage
 * 2. the resulting function is dealt with correctly by `CallbackPatcher`
 * 
 * @file 
 */

function f(a, b, c, d = 0) {
  console.log(this, a, b);
  return c + d;
}

var f2 = f.bind(0, 1, 2, 3);
var res1 = f2();
console.log(`${res1} === 3`, res1 === 3);

var res2 = f.apply(4, [5, 6, 7]);
console.log(`${res2} === 7`, res2 === 7);

var res3 = f.call(8, 9, 10, 11);
console.log(`${res3} === 11`, res3 === 11);

var res4 = f2.call(1000, 11); // 3 + 11 === 14
console.log(`${res4} === 14`, res4 === 14);

/**
 * If no arguments are provided to bind, or if the thisArg is null or undefined, 
 * the `this` of the executing scope is treated as the thisArg for the new function.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
 */
var res5 = (() => this).call(null);
console.log(`${res5} === globalThis`, res5 === this);
