// TODO: load automatically from BugsJs bug database
// NOTE: some bugs have multiple test files, or no test file at all
// see: https://github.com/BugsJS/express/releases?after=Bug-4-test
const configs = [
  {
    // https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js
    id: 1,
    label: 'BubbleSort bug#1',
    testName: 'BubbleSort should sort array',
    patch: 'error1',
    testFilePaths: ['src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js']
  },
  {
    id: 2,
    label: 'BubbleSort (ok)',
    testName: 'BubbleSort should sort array',
    testFilePaths: ['src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js']
  }
];

module.exports = configs;