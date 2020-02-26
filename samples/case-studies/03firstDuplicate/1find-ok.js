import eq from 'lodash/eq';

/**
 * find the first duplicate number for which the second occurrence has the minimal index
 * @see https://app.codesignal.com/interview-practice/task/pMvymcahZ8dY4g75q/description
 */
function firstDuplicate(a) {
    const dict = {};
    const idx = a.find(n => dict[n] > 0 || ((dict[n] = 1) && false));
    return idx === undefined ? -1 : idx;
}


console.assert(eq(
    firstDuplicate([2, 1, 3, 5, 3, 2]),
    3
  ));