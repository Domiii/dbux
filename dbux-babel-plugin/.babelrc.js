const { tryInjectSelf } = require('../config/build.config');

let cfg = require('../config/babel-presets-node');

console.warn('ENV', process.env.NODE_ENV);

tryInjectSelf(cfg);

cfg = {
  ignore: ['node_modules'],
  "sourceMaps": "inline",
  "retainLines": true,
  ...cfg,
  plugins
};

module.exports = cfg;