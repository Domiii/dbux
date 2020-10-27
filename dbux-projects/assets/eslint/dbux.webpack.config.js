const path = require('path');
const buildWebpackConfig = require('./dbux.webpack.config.base');

const { makeDynamicRequireRule } = require('./dbux.build-util');
require('@dbux/cli/lib/dbux-register-self');
require('@dbux/common/src/util/prettyLogs');


const ProjectRoot = path.resolve(__dirname);

// TODO feed entries in via CLI
const entryPoints = [
  // 'tests/lib/rules/no-obj-calls': path.join(ProjectRoot, 'tests/lib/rules/no-obj-calls.js') // 1
  // 'tests/lib/rules/prefer-template' // 3
  'tests/lib/rules/no-dupe-keys' // 4
];

const entry = Object.fromEntries(entryPoints.
  map(fpath => [fpath, path.join(ProjectRoot, fpath + '.js')]));

const resultCfg = buildWebpackConfig(ProjectRoot,
  {
    target: 'node',
    src: [
      'lib',
      'tests'
    ],
  },
  {
    entry,
    // externals,
    module: {
      rules: [
        makeDynamicRequireRule()
      ]
    }
  }
);

module.exports = resultCfg;