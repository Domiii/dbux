var path = require('path');

module.exports = {
  "extends": [path.join(__dirname, '../.eslintrc.js')],

  env: {
    commonjs: true,
    es6: true,
    node: true
  },

  settings: {
    'import/resolver': {
      // hackfix: https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-511007063
      node: {},
      //     webpack: {
      //       config: path.join(__dirname, '../webpack.config.js'),
      //       'config-index': 2
      //     }
      //   }
    }
  }
};