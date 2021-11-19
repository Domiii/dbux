const configs = [
  {
    id: 1,
    label: 'queue bug',
    testFilePaths: ['bug1.js'],
    bugLocations: [
      {
        file: 'lib/internal/queue.js',
        line: 127
      }
    ]
  },
  {
    id: 2,
    label: 'queue bug (fixed)',
    testFilePaths: ['bug1.js'],
    patch: 'bug1-fix',
  }
];

module.exports = configs;