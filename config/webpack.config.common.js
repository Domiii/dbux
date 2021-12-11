const process = require('process');
const path = require('path');
const webpack = require('webpack');

// /**
//  * @see https://stackoverflow.com/a/50432372
//  */
// process.on('warning', (warning) => {
//   console.warn('[NODE WARNING]', warning.stack);
// });

// add some of our own good stuff
require('../scripts/dbux-register-self');
require('../dbux-common/src/util/prettyLogs');

// const {pathNormalizedForce}  = require('');

const { getDbuxVersion } = require('@dbux/cli/lib/package-util');
const { pathNormalizedForce } = require('@dbux/common-node/src/util/pathUtil');

const MonoRoot = path.resolve(__dirname, '..');

module.exports = function webpackCommon(name, mode) {
  const DBUX_VERSION = getDbuxVersion(mode);
  const DBUX_ROOT = mode === 'development' ? pathNormalizedForce(MonoRoot) : '';
  process.env.NODE_ENV = mode; // set these, so babel configs also have it
  process.env.DBUX_ROOT = DBUX_ROOT;

  console.debug(`[${name}] (DBUX_VERSION=${DBUX_VERSION}, mode=${mode}, DBUX_ROOT=${DBUX_ROOT}) building...`);

  return {
    DBUX_VERSION,
    DBUX_ROOT
  };
};

// module.exports.msgPackPlugin = function msgPackPlugin() {
Object.assign(module.exports, {
  msgPackPlugin() {
    /**
     * @see https://github.com/Domiii/dbux/issues/570
     */
    return new webpack.NormalModuleReplacementPlugin(
      /notepack\.io/,
      // '@msgpack/msgpack'
      '@msgpack/msgpack/dist.es5+umd/msgpack.js'
    );
  }
});
