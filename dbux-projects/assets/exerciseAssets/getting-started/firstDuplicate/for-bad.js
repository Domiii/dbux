const tests = require('./tests');
const runTests = require('../runTests');

/**
 * Algorithm: Find the first duplicate number for which the second occurrence has the minimal index.
 * NOTE: This is a naive (read: slow) implementation.
 * The algorithm, despite being slow, can work correctly by making only a single change!
 * 
 * @see https://app.codesignal.com/interview-practice/task/pMvymcahZ8dY4g75q/description
 */
function firstDuplicate(a) {
  for (let i = 0; i < a.length; ++i) {
    for (let j = i; j < a.length; ++j) {
      if (a[i] === a[j]) {
        return a[i];
      }
    }
  }
  return -1;
}

runTests(firstDuplicate, tests);
