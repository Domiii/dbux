import isEqual from 'lodash/isEqual';

/**
 * Find array that contains largest number in array-of-arrays `a`
 * @see https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/return-largest-numbers-in-arrays
 */
function largestArray(a) {
  let largest = a[0];
  for (const next of a) {
    if (Math.max(...next) > Math.max(largest)) {
      largest = next;
    }
  }
  return largest;
}

// run test #1
const input = [[4, 5, 1, 3], [1000, 1001, 857, 1], [50, 73]];
const expected = [1000, 1001, 857, 1];
const actual = largestArray(input);

if (!isEqual(actual, expected)) {
  console.error('test failed');
}
