// eslint-disable-next-line no-console
console.log(`Starting #################...`);

const { window } = require('vscode');

global.window = window;

// eslint-disable-next-line no-console
console.log(`Activating Dbux...`);

/**
 * Put the whole thing into try/catch, so that activation errors are caught correctly.
 */
let preActivate, deactivate;
try {
  // eslint-disable-next-line global-require
  preActivate = require('./preActivate').default;
  // eslint-disable-next-line global-require
  deactivate = require('./deactivate').default;
}
catch (err) {
  // eslint-disable-next-line no-console
  console.error(`Dbux extension initialization failed:`, err);
  throw err;
}
module.exports = {
  activate: preActivate,
  deactivate
};
// module.exports = {
//   activate() {
//     console.log('hi this is Dbux');
//   },
//   deactivate
// };
