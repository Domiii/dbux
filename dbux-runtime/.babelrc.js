const path = require('path');
const thisRoot = path.resolve(__dirname);

module.exports = {
  ignore: [],
  "sourceMaps": "inline",
  "retainLines": true,
  ...require('../config/babel-presets-umd')
};