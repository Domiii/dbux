import eq from 'lodash/eq';

/**
 * @see https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/return-largest-numbers-in-arrays
 */
function largestOfFour(arr) {
  let largest = arr[0];
  for (const four of arr) {
    if (Math.max(...largest) < Math.max(four)) {
      largest = four;
    }
  }
  return largest;
}

console.assert(eq(
  largestOfFour([[4, 5, 1, 3], [13, 27, 18, 26], [32, 35, 37, 39], [1000, 1001, 857, 1]]),
  [1000, 1001, 857, 1]
));
