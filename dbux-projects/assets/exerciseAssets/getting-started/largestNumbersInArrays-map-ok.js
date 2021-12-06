const tests = require('./largestNumbersInArrays-tests');
const runTests = require('./runTests');

/**
 * Return an array consisting of the largest number from each provided sub-array.
 * For simplicity, the provided array will contain exactly 4 sub-arrays.
 * @see https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/return-largest-numbers-in-arrays
 */
function largestNumbersInArrays(a) {
  return a.map((next) => Math.max(...next));
}

runTests(largestNumbersInArrays, tests);
