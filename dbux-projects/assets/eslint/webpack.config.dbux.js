const path = require('path');
const buildWebpackConfig = require('./webpack.config.dbux.base');

const { makeDynamicRequireRule } = require('./build-util');
require('@dbux/cli/lib/dbux-register-self');
require('@dbux/common/src/util/prettyLogs');


const ProjectRoot = path.resolve(__dirname);


const resultCfg = buildWebpackConfig(ProjectRoot,
  {
    target: 'node',
    src: [
      'lib',
      'tests'
    ],
  },
  {
    entry: {
      // TODO feed entries in via CLI
      'tests/lib/rules/no-obj-calls': path.join(ProjectRoot, 'tests/lib/rules/no-obj-calls.js')
    },
    // externals,
    module: {
      rules: [
        makeDynamicRequireRule()
      ]
    }
  }
);

module.exports = resultCfg;