/**
 * @file Default parameters cannot use `arguments` (since they are not captured by lambdas)
 */

var path = require('path');

const f = (a, b = "", c = []) => {
  console.log(a,b,c);
};

f(123);