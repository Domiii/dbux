const isFunction = require('lodash/isFunction');
console.debug(`require(${require.resolve('lodash/isFunction')})`);
// const mixin = require('lodash/mixin');

class A {}

const o = {
  hi() { return 123; }
};

console.log(isFunction(A.prototype), '=== false');

// const A2 = mixin(A.prototype, o);
// console.log(new A2().hi());
