// eslint-disable-next-line no-console
// console.debug(`Starting #################...`);

const { window } = require('vscode');

global.window = window;

// eslint-disable-next-line no-console
console.debug(`Activating Dbux...`);

/**
 * Put the whole thing into try/catch, so that activation errors are caught correctly.
 */
let activate0, deactivate;
try {
  // eslint-disable-next-line global-require
  activate0 = require('./activate0').default;
  // eslint-disable-next-line global-require
  deactivate = require('./deactivate').default;
}
catch (err) {
  // eslint-disable-next-line no-console
  console.error(`Dbux extension initialization failed:`, err);
  throw err;
}

/**
 * VSCode Extension start-up hook.
 * 
 * @see https://code.visualstudio.com/api/references/activation-events#Start-up
 */
module.exports = {
  activate: activate0,
  deactivate
};
