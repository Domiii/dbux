const path = require('path');

module.exports = {
ignorePatterns: ['**/*'],

  extends: [path.join(__dirname, '../.eslintrc.js')],

  env: {
    commonjs: true,
    es6: true,
    node: true
  },

  globals: {
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