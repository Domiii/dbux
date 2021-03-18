const path = require('path');
const thisRoot = path.resolve(__dirname);

module.exports = {
  // see https://github.com/webpack/webpack/issues/11510#issuecomment-696027212
  sourceType: "unambiguous",
  ignore: [],
  sourceMaps: false,
  retainLines: true,
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '7',
          chrome: '70',
          safari: '13'
        },
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  ...require('../config/babel-presets-umd'),
};