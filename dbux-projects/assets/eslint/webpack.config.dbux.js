const path = require('path');
const buildWebpackConfig = require('./webpack.config.dbux.base');

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
      'tests/lib/rules/no-obj-calls': path.join(ProjectRoot, 'tests/lib/rules/no-obj-calls.js')
    }
  }
);

module.exports = resultCfg;