/**
 * Explanations: 
 * The goal is to use HoFs to get a result.
 * 
 * 1. Since we are interested in columns (not rows), we start by taking the transpose (NOTE: the input matrix is row-major).
 * 2. Since it's a 2D array, so we need two reduces to compute a complete sum.
 * 3. We only want the part of the array before the first 0: so we `slice` from the beginning until the first 0
 * 3b. Or until `column.length`, if there is no 0 (in which case `findIndex` returns -1).
 */

const runTest = require('../runTests');
const tests = require('./tests');

/**
 * @see https://app.codesignal.com/arcade/intro/level-2/xskq4ZxLyqQMCLshr
 */
function ghostlyMatrix(matrix) {
  // 2D matrix transpose: https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
  const transpose = matrix[0].map((_, i) => matrix.map(row => row[i]));
  
  return transpose.reduce((sum, column) => 
    sum + (
      column.slice(0, (column.findIndex(x => x === 0) + 1) || column.length)
    ).reduce((colSum, x) => colSum + x, 0),
    0
  );
}

runTest(ghostlyMatrix, tests);
