const path = require('path');

module.exports = {
  extends: [path.join(__dirname, '../.eslintrc.js')],
  
  env: {
    commonjs: true,
    es6: true,
    jest: true,
    node: true
  },

  rules: {
    'no-console': 0,
    'no-var': 0,
    'vars-on-top': 0,
    strict: 0,
    camelcase: 0,
    'prefer-object-spread': 0,
    'import/order': 0,
    'import/no-extraneous-dependencies': 0,
  }
};