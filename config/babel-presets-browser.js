const loadBabel = require('./loadBabel');
const sharedPlugins = require('./_sharedPlugins');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
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