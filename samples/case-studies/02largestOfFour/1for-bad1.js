import isEqual from 'lodash/isEqual';

/**
 * Find array that contains largest number in array-of-arrays `a`
 * @see https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/return-largest-numbers-in-arrays
 */
function largestOfFour(a) {
  let largest = a[0];
  for (const next of a) {
    if (Math.max(...next) > Math.max(...largest)) {
      largest = next;
    }
  }
  return largest;
}

// ########################################
// run test #1
// ########################################

console.error(
  'result correct:',
  isEqual(
    largestOfFour(
      [
        [4, 5, 1, 3], 
        [13, 27, 18, 26], 
        [32, 35, 37, 39], 
        [1000, 1001, 857, 1]
      ]
    ),
    [1000, 1001, 857, 1]
  )
);
