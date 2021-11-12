const path = require('path');

module.exports = {
  extends: [path.join(__dirname, '../config/.eslintrc.package.js')],

  env: {
    commonjs: true,
    browser: true
  },

  globals: {
    _WebResourceRoot: true,
    getClientResourceUri: true
  },

  settings: {
    'import/resolver': 'webpack'
  }
};