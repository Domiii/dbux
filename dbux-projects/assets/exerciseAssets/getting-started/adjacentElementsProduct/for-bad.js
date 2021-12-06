const tests = require('./tests');
const runTests = require('../runTests');

/**
 * @see https://app.codesignal.com/arcade/intro/level-2/xzKiBHjhoinnpdh6m
 */
function adjacentElementsProduct(a) {
  var biggest = a[0] * a[1];
  for (i = 1; i < a.length - 1; ++i) {
    const product = a[i] * a[i - 1];
    if (product > biggest) {
      biggest = product;
    }
  }
  return biggest;
}

runTests(adjacentElementsProduct, tests);

