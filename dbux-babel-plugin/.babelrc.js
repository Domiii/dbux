const cfg = require('../config/babel-presets-node');

console.warn('ENV', process.env.NODE_ENV);

let { plugins } = cfg;
if (process.env.NODE_ENV === 'development') {
  // big play experiments: use dbux to debug itself
  try {
    // if available (and if experimenting), add (a separate copy of the) babel plugin to itself
    const self = require('../../dbux-experiments/node_modules/@dbux/babel-plugin');
    plugins = plugins.concat(self);
  }
  catch (err) {
    // don't do anything
    console.error(err);
  }
}

module.exports = {
  ignore: ['node_modules'],
  "sourceMaps": "inline",
  "retainLines": true,
  ...cfg,
  plugins
};