/**
 * @see https://github.com/facebook/jest/issues/6229
 */

const shouldIgnore = require('@dbux/babel-plugin/dist/shouldIgnore').default;
const ignoreOptions = {
  // packageWhitelist: 'jest,jest[-].*,@jest.*',
  packageWhitelist: '.*',
  packageBlacklist: 'require.*,import.*,locate.*',
  fileWhitelist: '.*',
  fileBlacklist: 'requireOrImportModule\\.js'
};

const ignore = [
  shouldIgnore(ignoreOptions)
];

module.exports = {
  "presets": [
    [
      "@babel/preset-env",
      {
        // debug: true,
        targets: {
          node: 16
        },
        // useBuiltIns: "usage",
        shippedProposals: true,
        // corejs: {
        //   version: '3.15',
        //   proposals: true
        // }
      }
    ]
  ],
  "plugins": [
    ["@dbux/babel-plugin", {
      verbose: 1,
      runtime: '{"tracesDisabled": 1}'
    }]],

  ignore
};
