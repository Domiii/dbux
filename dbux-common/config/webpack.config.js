const defaultsDeep = require('../node_modules/lodash/defaultsDeep');
const path = require('path');
const rootPath = path.resolve(__dirname + '/..');

module.exports = defaultsDeep(
  {
    entry: {
      // index: './index.js',
      // util: './util',
      'util/Enum': './util/Enum',
    }
  },
  require('../../dbux-common/config/webpack.common')(rootPath)
);