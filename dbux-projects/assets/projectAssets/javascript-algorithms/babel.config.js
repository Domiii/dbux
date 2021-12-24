/**
 * @see https://github.com/facebook/jest/issues/6229
 */

const shouldIgnore = require('@dbux/babel-plugin/dist/shouldIgnore').default;
// const ignoreOptions = {
//   // packageWhitelist: 'jest,jest[-].*,@jest.*',
//   packageWhitelist: '.*',
//   // packageBlacklist: 'require.*,import.*,locate.*',
//   fileWhitelist: '.*',
//   fileBlacklist: 'dbux[^/\\\\]*[.]js'
// };

const targets = {
  node: 16
};

/**
 * Ignore node_modules by default.
 */
const ignoreOptions = {
  packageWhitelist: '.*'
};

const ignore = [
  shouldIgnore(ignoreOptions)
];


module.exports = {
  // sourceMaps: false,
  targets,
  presets: [
    [
      "@babel/preset-env",
      {
        // debug: true,
        targets,
        // useBuiltIns: "usage",
        shippedProposals: true,
        // corejs: {
        //   version: '3.15',
        //   proposals: true
        // }
      }
    ]
  ],
  plugins: [
    ["@dbux/babel-plugin", {
      verbose: 1,
      // runtime: '{"tracesDisabled": 1}'
    }]],

  ignore
};
