const path = require('path');
const thisRoot = path.resolve(__dirname);

module.exports = {
  // see https://github.com/webpack/webpack/issues/11510#issuecomment-696027212
  sourceType: "unambiguous",
  ignore: [],
  sourceMaps: false,
  retainLines: true,
  ...require('../config/babel-presets-umd'),
};