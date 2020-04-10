var path = require('path');

module.exports = {
  "extends": [path.join(__dirname, '../.eslintrc.js')],

  settings: {
    'import/resolver': {
      webpack: {
        config: path.join(__dirname, '../webpack.config.js'),
        'config-index': 3
      }
    }
  }
};