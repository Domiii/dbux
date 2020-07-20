try {
  // eslint-disable-next-line global-require
  const mods = require('./index');
  const { activate, deactivate } = mods;
  module.exports = { activate, deactivate };
}
catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
  debugger;
  throw err;
}