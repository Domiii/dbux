const tests = require('./tests');
const runTests = require('../runTests');

/**
 * @see https://app.codesignal.com/arcade/intro/level-2/xzKiBHjhoinnpdh6m
 */
function adjacentElementsProduct(a) {
  return a.reduce((acc, x, i) => {
    if (i < a.length - 1) {
      return Math.max(acc, x * a[i + 1]);
    }
    return acc;
  }, 0);
}

runTests(adjacentElementsProduct, tests);

