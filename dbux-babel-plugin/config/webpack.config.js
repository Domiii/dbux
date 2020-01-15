
const path = require('path');
const rootPath = path.resolve(__dirname + '/..');

module.exports = require('dbux-common/config/webpack.common')(rootPath);