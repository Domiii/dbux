/* eslint-disable no-console */

const shouldInjectSelf = false;

/**
 * big play experiments: use dbux to debug itself
 */
function tryInjectSelf(babelCfg) {
  if (process.env.NODE_ENV !== 'development' || !shouldInjectSelf) {
    return;
  }
  
  let babelPluginCopy;
  try {
    // eslint-disable-next-line global-require
    babelPluginCopy = require('../../dbux-experiments/node_modules/@dbux/babel-plugin');
  }
  catch (err) {
    err.message = `Could not load copy of babel plugin but shouldInjectSelf = true - ${err.message}`;
    throw err;
  }

  let { plugins } = babelCfg;

  // if available (and if experimenting), add (a separate copy of the) babel plugin to this babel config
  const pluginCfg = {
    runtime: {
      port: 3375// 3374
    }
  };
  plugins.push([babelPluginCopy, pluginCfg]);
}

module.exports = {
  // whether dbux should inject a copy of itself into itself, in order to debug dbux with dbux (only available for development builds)
  shouldInjectSelf,
  tryInjectSelf
};