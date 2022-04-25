const loadBabel = require('./loadBabel');
const sharedPlugins = require('./_sharedPlugins');

module.exports = {
  // presets: [
  //   [
  //     loadBabel('@babel/preset-env'),
  //     {
  //       targets: {
  //         node: '12',
  //         chrome: '70',
  //         safari: '13'
  //       },
  //       useBuiltIns: 'usage',
  //       corejs: "3.15"
  //     }
  //   ]
  // ],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '7.6', // earliest support for async functions (to avoid async-generator-runtime)
          chrome: '70',
          safari: '13'
        },
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  plugins: sharedPlugins
};