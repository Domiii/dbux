const defaultsDeep = require('../node_modules/lodash/defaultsDeep');
const path = require('path');
const rootPath = path.resolve(__dirname + '/..');

module.exports = defaultsDeep(
  {
    // no customizations yet
  },
  require('./webpack.common')(rootPath)
);