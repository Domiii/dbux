try {
  const mods = require('./index');
  const { activate, deactivate } = mods;
  module.exports = {
    activate, deactivate
  };
}
catch (err) {
  console.error(err);
  debugger;
  throw err;
}