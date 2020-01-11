const path = require('path');

const dbuxRoot = path.resolve(__dirname + '/../..');
const folders = ['dbux-common', 'dbux-data', 'dbux-runtime'];

const foldersAbsolute = folders.map(f => path.join(dbuxRoot, f));
console.warn(foldersAbsolute);
let folderPrefix = path.join(dbuxRoot, `(${folders.map(f => `(${f})`).join('|')})`);

// fix: backslashes on windows
folderPrefix = folderPrefix.replace(/\\/g, '\\\\');

// fix: sometimes drive letters on windows are capitalized, sometimes not
folderPrefix = folderPrefix.toLowerCase();

const babelRegisterOptions = {
  ignore: [
    // '**/node_modules/**',
    function (fpath) {
      // no node_modules
      if (fpath.match('node_modules')) {
        return true;
      }

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
  babelrcRoots: foldersAbsolute
};
const babelRegister = require('@babel/register');
babelRegister(babelRegisterOptions);

module.exports = require('./index');