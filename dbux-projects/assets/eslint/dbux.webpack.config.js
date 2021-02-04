const path = require('path');
const buildWebpackConfig = require('./dbux.webpack.config.base');

const { makeDynamicRequireRule } = require('./dbux.build-util');
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
  (env, argv) => {
    let entry = Object.fromEntries(env.entry.split(',').map(fpath => [fpath.replace(/\.[^/.]+$/, ""), path.join(ProjectRoot, fpath)]));
    return {
      entry,
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
      ],
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