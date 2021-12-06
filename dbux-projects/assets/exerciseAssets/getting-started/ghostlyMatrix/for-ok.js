const runTest = require('../runTests');
const tests = require('./tests');

/**
 * @see https://app.codesignal.com/arcade/intro/level-2/xskq4ZxLyqQMCLshr/solutions
 */
function ghostlyMatrix(matrix) {
  let sum = 0;
  for (let j = 0; j < matrix[0].length; j++) {
    for (let i = 0; i < matrix.length; i++) {
      if (!matrix[i][j]) {
        break;
      }
      else {
        sum += matrix[i][j];
      }
    }
  }
  return sum;
}

runTest(ghostlyMatrix, tests);
