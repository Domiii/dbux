const tests = require('./tests');
const runTests = require('../runTests');

/**
 * find the first duplicate number for which the second occurrence has the minimal index
 * @see https://app.codesignal.com/interview-practice/task/pMvymcahZ8dY4g75q/description
 */
function firstDuplicate(a) {
  const dict = {};
  const result = a.find(n => {
    if (dict[n]) {
      return true;
    }
    dict[n]++;
    return false;
  });
  return result === undefined ? -1 : result;
}

runTests(firstDuplicate, tests);
