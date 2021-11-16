const path = require('path');

x = 3;

module.exports = {
  ignorePatterns: ['**/*'],

  extends: [path.join(__dirname, '../config/.eslintrc.babel.js')],

  env: {
    commonjs: true,
    es6: true,
    node: true
  },

  settings: {
    'import/resolver': {
      // hackfix: https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-511007063
      node: {},
      webpack: {
        // 'config-index': 3
      }
    }
  }
};