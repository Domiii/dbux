/* eslint-disable no-console */

const shouldInjectSelf = true;

let babelPluginCopy;
if (shouldInjectSelf) {
  try {
    // eslint-disable-next-line global-require
    babelPluginCopy = require('../../dbux-experiments/node_modules/@dbux/babel-plugin');
  }
  catch (err) {
    console.error(`Could not load copy of babel plugin but shouldInject = true -`, err);
  }
}

/**
 * big play experiments: use dbux to debug itself
 */
function tryInjectSelf(babelCfg) {
  if (!shouldInjectSelf || !babelPluginCopy || process.env.NODE_ENV !== 'development') {
    return;
  }

  let { plugins } = babelCfg;

  // if available (and if experimenting), add (a separate copy of the) babel plugin to this babel config
  plugins.push(babelPluginCopy);
}

module.exports = {
  // whether dbux should inject a copy of itself into itself, in order to debug dbux with dbux (only available for development builds)
  shouldInjectSelf,
  tryInjectSelf
};