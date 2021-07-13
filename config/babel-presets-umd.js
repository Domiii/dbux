const loadBabel = require('./loadBabel');
const sharedPlugins = require('./_sharedPlugins');

module.exports = {
  presets: [
    [
      loadBabel('@babel/preset-env'),
      {
        targets: {
          node: '12',
          chrome: '70',
          safari: '13'
        },
        useBuiltIns: 'usage',
        corejs: 3.15
      }
    ]
  ],
  plugins: sharedPlugins
};