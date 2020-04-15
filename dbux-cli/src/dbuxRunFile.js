const path = require('path');
const dbuxRegister = require('./dbuxRegister');

module.exports = function dbuxRunFile(targetPath) {
  dbuxRegister(targetPath);

  // go time!
  if (!path.isAbsolute(targetPath)) {
    throw new Error();
  }

  try {
    require(targetPath);
  }
  catch (err) {
    console.error('ERROR when running instrumented code:\n ', err && err.stack || err);
  }
};