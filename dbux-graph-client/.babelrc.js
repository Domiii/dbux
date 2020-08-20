const path = require('path');
const thisRoot = path.resolve(__dirname);

module.exports = {
  ignore: [path.join(thisRoot, 'node_modules')],
  "sourceMaps": "both",
  "retainLines": true,
  ...require('../config/babel-presets-browser')
};