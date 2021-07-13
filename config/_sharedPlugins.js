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
  loadBabel('@babel/plugin-syntax-top-level-await')

  // NOTE: cannot convert mjs with @babel/register: https://github.com/babel/babel/issues/6737
  // '@babel/plugin-transform-modules-commonjs'
];