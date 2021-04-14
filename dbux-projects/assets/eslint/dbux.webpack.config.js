const path = require('path');
const buildWebpackConfig = require('./dbux.webpack.config.base');

const { makeDynamicRequireRule } = require('./dbux.build-util');
require('@dbux/cli/lib/dbux-register-self');
require('@dbux/common/src/util/prettyLogs');

const ProjectRoot = path.resolve(__dirname);

const customConfig = {
  target: 'node',
  src: [
    'lib',
    'tests'
  ],
  babelOptions: {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: '7'
          },
          useBuiltIns: 'usage',
          corejs: 3
        }
      ]
    ]
  }
};

const resultCfg = buildWebpackConfig(ProjectRoot, customConfig,
  (env, argv) => {
    return {
      // externals,
      module: {
        rules: [
          makeDynamicRequireRule()
        ]
      }
    };
  }
);

module.exports = resultCfg;