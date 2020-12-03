const cfg = require('../config/babel-presets-node');

if (process.env.NODE_ENV === 'development') {
  // big play experiments: use dbux to debug itself
  let { plugins } = cfg;
  try {
    // if available (and if experimenting), add (a separate copy of the) babel plugin to itself
    const self = require('../../dbux-experiments/node_modules/@dbux/babel-plugin');
    plugins = plugins.concat(self);
  }
  catch (err) {
    // don't do anything
  }
}

module.exports = {
  ignore: ['node_modules'],
  "sourceMaps": "inline",
  "retainLines": true,
  ...cfg,
  plugins
};