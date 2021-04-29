module.exports = {
  ignore: ['node_modules'],
  "sourceMaps": "both",
  "retainLines": true,
  ...require('../config/babel-presets-node')
};