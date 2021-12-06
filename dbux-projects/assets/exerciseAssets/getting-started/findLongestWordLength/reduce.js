const runTest = require('../runTests');
const tests = require('./tests');

/**
 * @see https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/find-the-longest-word-in-a-string
 */
function findLongestWordLength(str) {
  const words = str.split(' ');
  return words.reduce((a, w) => Math.max(a, w.length), 0);
}


runTest(findLongestWordLength, tests);
