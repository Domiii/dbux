// TODO: load automatically from BugsJs bug database
// NOTE: some bugs have multiple test files, or no test file at all
// see: https://github.com/BugsJS/express/releases?after=Bug-4-test
const config = [
  {
    // see https://github.com/BugsJS/eslint/commit/e7839668c859752e5237c829ee2a1745625b7347
    id: 1,
    testRe: '',
    nodeVersion: 7,
    testFilePaths: ['tests/lib/rules/no-obj-calls.js']
  },
  // {
  //   // test file too large
  //   // see https://github.com/BugsJS/eslint/commit/125f20e630f01d67d9433ef752924a5bb75005fe
  //   id: 2,
  //   testRe: '',
  //   testFilePaths: ['']
  // },
  // {
  //   // problem: load-rules
  //   id: 3,
  //   testRe: '',
  //   nodeVersion: 8,
  //   testFilePaths: ['tests/lib/rules/prefer-template.js']
  // },
  {
    // see https://github.com/BugsJS/eslint/commit/e7839668c859752e5237c829ee2a1745625b7347
    id: 4,
    testRe: '',
    nodeVersion: 7,
    testFilePaths: ['tests/lib/rules/no-dupe-keys.js']
  },
];

module.exports = config;