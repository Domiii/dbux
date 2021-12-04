module.exports = {
  // The bail config option can be used here to have Jest stop running tests after
  // the first failure.
  bail: false,

  // Indicates whether each individual test should be reported during the run.
  verbose: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // If the test path matches any of the patterns, it will be skipped.
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],

  // The pattern Jest uses to detect test files.
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$',

  // This option sets the URL for the jsdom environment.
  // It is reflected in properties such as location.href.
  // @see: https://github.com/facebook/jest/issues/6769
  testURL: 'http://localhost/',

  /**
   * important: provide via `jest.config.js`
   * (Because when trying to pass it in via `@dbux/cli`, its process.argv value gets casted to `int`, for some odd reason, leading to an error.)
   */
  testTimeout: 30000,

  transformIgnorePatterns: [
    '(.*[\\/])?dbux[-]runtime([\\/].*)?',
    '(.*[\\/])?@dbux/runtime([\\/].*)?',
    'dbux[^/\\\\]*[.]js',
    '[\\/]node_modules[\\/]'
  ]
};
