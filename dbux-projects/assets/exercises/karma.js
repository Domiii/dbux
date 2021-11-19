// TODO: load automatically from BugsJs bug database
// NOTE: some bugs have multiple test files, or no test file at all
// see: https://github.com/BugsJS/express/releases?after=Bug-4-test
const config = [
  // see https://github.com/BugsJS/eslint/commit/e7839668c859752e5237c829ee2a1745625b7347
  {
    id: 2,
    testRe: 'should parse right port of proxy target',
    testFilePaths: ['test/unit/middleware/proxy.spec.js']
  }
];

module.exports = config;