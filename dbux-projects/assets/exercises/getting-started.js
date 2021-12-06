
module.exports = [
  {
    id: 1,
    label: 'largestNumberInArrays (for loop) bug',
    assets: [
      'largestNumberInArrays-for-bad.js',
      'largestNumberInArrays-tests.js'
    ],
    testFilePaths: ['largestNumberInArrays-for-bad.js'],
    bugLocations: [
      {
        fileName: 'largestNumberInArrays-for-bad.js',
        line: 12
      }
    ]
  },
];
