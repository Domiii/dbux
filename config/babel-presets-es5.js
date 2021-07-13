// NOTE: we cannot use preset + plugin names, but *must* `require` them directly
//      See: https://github.com/Domiii/dbux/issues/456

const loadBabel = require('./loadBabel');
const sharedPlugins = require('./_sharedPlugins');

module.exports = {
  sourceType: 'unambiguous',
  presets: [
    [
      loadBabel('@babel/preset-env'),
      {
        useBuiltIns: 'usage',
        corejs: 3.15
      }
    ]
  ],
  plugins: sharedPlugins
};