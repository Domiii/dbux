import { window } from 'vscode';

global.window = window;

/**
 * Put the whole thing into try/catch, so that activation errors are caught correctly.
 */
try {
  // eslint-disable-next-line global-require
  const preActivate = require('./preActivate');
  // eslint-disable-next-line global-require
  const deactivate = require('./deactivate');
  module.exports = { activate: preActivate, deactivate };
}
catch (err) {
  // eslint-disable-next-line no-console
  console.error(`Dbux extension initialization failed:`, err);
  debugger;
  throw err;
}