/**
 * Use this to capture weird errors when loading.
 * 
 * @file
 */

try {
  // eslint-disable-next-line global-require
  const { preActivate } = require('./preActivate');
  // eslint-disable-next-line global-require
  const { deactivate } = require('./index');
  module.exports = { activate: preActivate, deactivate };
}
catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
  debugger;
  throw err;
}