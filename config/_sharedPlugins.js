const loadBabel = require('./loadBabel');

module.exports = [
  loadBabel('@babel/plugin-proposal-optional-chaining'),
  [
    loadBabel('@babel/plugin-proposal-decorators'),
    {
      legacy: true
    }
  ],
  loadBabel('@babel/plugin-proposal-function-bind'),
  loadBabel('@babel/plugin-syntax-export-default-from'),
  loadBabel('@babel/plugin-syntax-dynamic-import'),
  loadBabel('@babel/plugin-transform-runtime'),
  loadBabel('@babel/plugin-syntax-top-level-await'),
  
  /**
   * @see https://blog.saeloun.com/2021/06/24/babel-enables-class-field-and-private-methods.html
   */
  loadBabel('@babel/plugin-proposal-class-properties'),


  // typescript support
  loadBabel('@babel/plugin-transform-typescript')

  // NOTE: cannot convert mjs with @babel/register: https://github.com/babel/babel/issues/6737
  // '@babel/plugin-transform-modules-commonjs'
];