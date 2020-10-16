var path = require('path');

module.exports = {
  extends: [path.join(__dirname, '../.eslintrc.js')],

  env: {
    "commonjs": true,
    "browser": true
  },

  globals: {
    _WebResourceRoot: true
  },

  settings: {
    'import/resolver': 'webpack'
  }
};