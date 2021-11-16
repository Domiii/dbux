let path = require('path');

/**
 * @see https://github.com/babel/babel/issues/11975#issuecomment-798832457
 */
module.exports = {
  extends: [path.join(__dirname, '../.eslintrc.js')],
  parserOptions: {
    // babelOptions: {
    //   configFile: './babel.config.js'
    // }
  }
};