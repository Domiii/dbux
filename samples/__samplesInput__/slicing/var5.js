/**
 * @file Default parameters of lambda expressions. (NOTE: they don't have their own `arguments`)
 */

var path = require('path');

const f = (a, b = "b", c = []) => {
  console.log(a,b,c);
};

f(123);