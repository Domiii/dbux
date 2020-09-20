const path = require('path');
const buildWebpackConfig = require('./webpack.config.dbux.base');

const ProjectRoot = path.resolve(__dirname);

// TODO: fix dynamic externals
//      see https://github.com/webpack/webpack/issues/4175#issuecomment-450746682
const externals = [
  {
  }
];

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
      'tests/lib/rules/no-obj-calls': path.join(ProjectRoot, 'tests/lib/rules/no-obj-calls.js')
    },
    externals
  }
);

module.exports = resultCfg;