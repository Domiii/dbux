// TODO: load automatically from BugsJs bug database
// NOTE: some bugs have multiple test files, or no test file at all
// see: https://github.com/BugsJS/express/releases?after=Bug-4-test
const configs = [
  {
    // https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js
    id: 1,
    label: 'BubbleSort bug#1',
    testNamePattern: 'BubbleSort should sort array',
    patch: 'error1',
    testFilePaths: ['src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js']
  },
  {
    id: 2,
    label: 'BubbleSort bug#2',
    testNamePattern: 'BubbleSort should sort array',
    testFilePaths: ['src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js']
  },
  {
    id: 3,
    label: 'BinarySearch bug#1',
    testNamePattern: 'binarySearch should search',
    testFilePaths: ['src/algorithms/search/binary-search/__test__/binarySearch.test.js']
  },
  {
    id: 4,
    label: 'BinarySearch bug#2',
    testNamePattern: 'binarySearch should search',
    testFilePaths: ['src/algorithms/search/binary-search/__test__/binarySearch.test.js']
  },
  {
    id: 5,
    label: 'BinarySearch (ok)',
    testNamePattern: '.*',
    testFilePaths: ['src/algorithms/search/binary-search/__test__/binarySearch.test.js']
  }
];

module.exports = configs;
