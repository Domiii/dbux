/**
 * TODO: this should not be necessary anymore. Can probably delete?
 * Used for embedding runtime without webpack build.
 * 
 * @file
 */

const path = require('path');
const babelRegister = require('@babel/register');
const babelPresets = require('../config/babel-presets-node');

let dbuxRoot = path.resolve(path.join(__dirname, '..', '..'));
if (dbuxRoot.endsWith('node_modules')) {
  dbuxRoot = path.resolve(dbuxRoot + '/..');
}
const folders = ['dbux-common', 'dbux-data', 'dbux-runtime'];

let babelrcRoots = folders.map(f => path.join(dbuxRoot, f));
// fix: backslashes on windows
babelrcRoots = babelrcRoots.map(root => root.replace(/\\/g, '\\\\'));

let folderPrefix = `^${path.join(
  dbuxRoot,
  `(?:${path.join('node_modules', '/')})?(${folders.map(f => `(${f})`).join('|')})`,
  '(?!.*?node_modules)'
)}`;

// fix: backslashes on windows
folderPrefix = folderPrefix.replace(/\\/g, '\\\\');
// console.warn('babelrcRoots', babelrcRoots);

// fix: sometimes drive letters on windows are capitalized, sometimes not
folderPrefix = folderPrefix.toLowerCase();

const babelRegisterOptions = {
  ...babelPresets,
  ignore: [
    // '**/node_modules/**',
    function (fpath) {
      // no node_modules
      // if (fpath.match('node_modules')) {
      //   return true;
      // }

      fpath = fpath.toLowerCase();

      const shouldIgnore = !fpath.match(folderPrefix);
      
      // eslint-disable-next-line no-console
      console.warn('[dbux-runtime] babel', fpath, !shouldIgnore, folderPrefix);
      return shouldIgnore;
    }
  ],
  sourceMaps: "both",
  retainLines: true,
  babelrcRoots
};
babelRegister(babelRegisterOptions);

module.exports = require('./src/index');