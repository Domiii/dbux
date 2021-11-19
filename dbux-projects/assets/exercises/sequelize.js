const configs = [
  {
    label: 'sscce1-sqlite',
    testFilePaths: ['sscce1.js']
  },
  {
    label: 'error1-sqlite',
    testFilePaths: ['error1.js']
  },
  // {
  //   label: 'findOrCreate-atomic-violation',
  //   tag: 'v3.5.1',
  //   patch: 'findOrCreate-av1',
  //   testFilePaths: ['findOrCreate-av1.js']
  // },
  {
    label: 'findOrCreate-serial',
    testFilePaths: ['findOrCreate-serial.js']
  },
  {
    name: 'findOrCreate-parallel',
    hasAssets: true,
    label: 'findOrCreate-parallel',
    testFilePaths: ['findOrCreate-parallel.js']
  },
  {
    name: 'findOrCreate-parallel-rewrite',
    hasAssets: true,
    label: 'findOrCreate-parallel-rewrite',
    testFilePaths: ['findOrCreate-parallel.js']
  },
];

module.exports = configs;