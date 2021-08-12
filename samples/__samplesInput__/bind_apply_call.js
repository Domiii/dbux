/**
 * `bind`, `apply` and `call` are native wrappers around functions.
 * We need to make sure:
 * 1. the underlying function gets the correct input and output `DataNode` linkage
 * 2. the resulting function is dealt with correctly by `CallbackPatcher`
 * 
 * @file 
 */

function f(a, b, c, d = 0) {
  console.log('f():', this, a, b);
  return c + d;
}

var f2 = f.bind(0, 1, 2, 3);
var res1 = f2();
console.log(`${res1} === 3`, res1 === 3);

var res1b = f2.call(1000, 27); // 3 + 27 === 30
console.log(`${res1b} === 30`, res1b === 30);

var res2 = f.call(4, 5, 6, 7);
console.log(`${res2} === 7`, res2 === 7);

var res3 = f.apply(8, [9, 10, 11]);
console.log(`${res3} === 11`, res3 === 11);


/**
 * If no arguments are provided to bind, or if the thisArg is null or undefined, 
 * the `this` of the executing scope is treated as the thisArg for the new function.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
 */
var res1b = (() => this).call(null);
const fileLevelThis = this;
console.log(`${res1b} === fileLevelThis`, res1b === fileLevelThis);
