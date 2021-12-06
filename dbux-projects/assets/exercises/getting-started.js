
module.exports = [
  {
    id: 1,
    label: 'largestNumbersInArrays (for loop) bug',
    assets: [
      'largestNumbersInArrays-for-bad.js',
      'largestNumbersInArrays-tests.js'
    ],
    testFilePaths: ['largestNumbersInArrays-for-bad.js'],
    bugLocations: [
      {
        fileName: 'largestNumbersInArrays-for-bad.js',
        line: 12
      }
    ]
  },
];
