const path = require('path');

module.exports = {
  extends: [path.join(__dirname, '../config/.eslintrc.package.js')],
  
  env: {
    commonjs: true,
    es6: true,
    jest: true,
    node: true
  },

  rules: {
    'no-console': 0
  }
};