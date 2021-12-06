const tests = require('./tests');
const runTests = require('../runTests');

/**
 * find the first duplicate number for which the second occurrence has the minimal index
 * @see https://app.codesignal.com/interview-practice/task/pMvymcahZ8dY4g75q/description
 */
function firstDuplicate(a) {
  const dict = {};
  const result = a.find(n => {
    if (dict[n] > 0) {
      return true;
    }
    dict[n] = 1;
    return false;
  });
  return result === undefined ? -1 : result;
}

runTests(firstDuplicate, tests);
