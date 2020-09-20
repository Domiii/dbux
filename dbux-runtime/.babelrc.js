const path = require('path');
const thisRoot = path.resolve(__dirname);

module.exports = {
  ignore: [],
  "sourceMaps": "inline",
  "retainLines": true,
  ...require('../config/babel-presets-umd'),

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
};