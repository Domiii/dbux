// const path = require('path');

dbuxRoot = __dirname;

module.exports = {
  ignore: ['node_modules'],
  sourceMaps: "both",
  retainLines: true,
  babelrcRoots: [
    dbuxRoot + "/dbux-babel-plugin",
    dbuxRoot + "/dbux-common",
    dbuxRoot + "/dbux-runtime"
  ]
};

console.warn('BABEL CONFIG LOADED');