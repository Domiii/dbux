try {
  const mods = require('./index');
  module.exports = {
    ...mods
  };
}
catch (err) {
  debugger;
  throw err;
}