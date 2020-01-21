const path = require('path');

let dbuxRoot = path.resolve(__dirname + '/../..');
if (dbuxRoot.endsWith('node_modules')) {
  dbuxRoot = path.resolve(dbuxRoot + '/..');
}
const folders = ['dbux-common', 'dbux-data', 'dbux-runtime'];

let babelrcRoots = folders.map(f => path.join(dbuxRoot, f));
// fix: backslashes on windows
babelrcRoots = babelrcRoots.map(root => root.replace(/\\/g, '\\\\'));

let folderPrefix = path.join(dbuxRoot, `(${folders.map(f => `(${f})`).join('|')})`);
// fix: backslashes on windows
folderPrefix = folderPrefix.replace(/\\/g, '\\\\');
// console.warn('babelrcRoots', babelrcRoots);

// fix: sometimes drive letters on windows are capitalized, sometimes not
folderPrefix = folderPrefix.toLowerCase();

const babelRegisterOptions = {
  ignore: [
    // '**/node_modules/**',
    function (fpath) {
      // no node_modules
      // if (fpath.match('node_modules')) {
      //   return true;
      // }

      fpath = fpath.toLowerCase();

      const shouldIgnore = !fpath.match(folderPrefix);
      console.warn(fpath, !shouldIgnore, folderPrefix);
      return shouldIgnore;
    }
  ],
  sourceMaps: "both",
  retainLines: true,
  // plugins: [
  //   '@babel/plugin-transform-runtime'
  // ],
  presets: [
    "@babel/preset-env"
  ],
  // presets: [[
  //   "@babel/preset-env",
  //   {
  //     "loose": true,
  //     "useBuiltIns": "usage",
  //     "corejs": 3
  //   }
  // ]],
  babelrcRoots
};
const babelRegister = require('@babel/register');
babelRegister(babelRegisterOptions);

module.exports = require('./index');