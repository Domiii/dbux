const tests = require('./largestNumbersInArrays-tests');
const runTests = require('./runTests');

/**
 * Return an array consisting of the largest number from each provided sub-array.
 * For simplicity, the provided array will contain exactly 4 sub-arrays.
 * @see https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/return-largest-numbers-in-arrays
 */
function largestNumbersInArrays(a) {
  const result = [];
  for (const next of a) {
    let largest = 0;
    for (let j = 0; j < next.length; ++j) {
      largest = Math.max(largest, next[j]);
    }
    result.push(largest);
  }
  return result;
}

runTests(largestNumbersInArrays, tests);
