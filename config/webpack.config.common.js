/* eslint no-console: 0 */

const process = require('process');
const path = require('path');

// /**
//  * @see https://stackoverflow.com/a/50432372
//  */
// process.on('warning', (warning) => {
//   console.warn('[NODE WARNING]', warning.stack);
// });

// add some of our own good stuff
require('../dbux-cli/lib/dbux-register-self');
require('../dbux-common/src/util/prettyLogs');

const {
  getDbuxVersion
} = require('../dbux-cli/lib/package-util');

const MonoRoot = path.resolve(__dirname, '..');

process.env.BABEL_DISABLE_CACHE = 1;

module.exports = function webpackCommon(name, mode) {
  const DBUX_VERSION = getDbuxVersion(mode);
  const DBUX_ROOT = mode === 'development' ? MonoRoot : '';
  process.env.NODE_ENV = mode; // set these, so babel configs also have it
  process.env.DBUX_ROOT = DBUX_ROOT;

  console.debug(`[${name}] (DBUX_VERSION=${DBUX_VERSION}, mode=${mode}, DBUX_ROOT=${DBUX_ROOT}) building...`);

  return {
    DBUX_VERSION,
    DBUX_ROOT
  };
};