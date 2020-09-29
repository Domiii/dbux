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
      // see https://github.com/BugsJS/karma/commit/8add6a2a1008492cff4d76e6697edab64955666c
      'test/unit/middleware/proxy.spec': path.join(ProjectRoot, 'test/unit/middleware/proxy.spec.js')
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