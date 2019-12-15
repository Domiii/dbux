const defaultsDeep = require('../node_modules/lodash/defaultsDeep');
const path = require('path');
const rootPath = path.resolve(__dirname + '/..');

module.exports = defaultsDeep(
  {
    entry: {
      // index: 'src/index.js',
      Enum: './Enum.js'
    }
  },
  require('../../dbux-common/config/webpack.common')(rootPath)
);