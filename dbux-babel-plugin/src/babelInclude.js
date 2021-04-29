/**
 * TODO: this should not be necessary anymore. Can probably delete?
 */

const path = require('path');
const babelRegister = require('@babel/register');
const babelPresets = require('../../config/babel-presets-node');

let dbuxRoot = path.resolve(path.join(__dirname, '..', '..'));
if (dbuxRoot.endsWith('node_modules')) {
  dbuxRoot = path.resolve(dbuxRoot + '/..');
}
const ignoredFolders = ['dbux-common', 'dbux-common-node', 'dbux-babel-plugin'];

let babelrcRoots = ignoredFolders.map(f => path.join(dbuxRoot, f));
// fix: backslashes on windows
babelrcRoots = babelrcRoots.map(root => root.replace(/\\/g, '\\\\'));

let folderPrefix = `^${path.join(
  dbuxRoot,
  `(?:${path.join('node_modules', '/')})?(${ignoredFolders.map(f => `(${f})`).join('|')})`,
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
      // console.warn('(dbux-babel) include', fpath, !shouldIgnore, folderPrefix);
      return shouldIgnore;
    }
  ],
  babelrc: true,
  sourceMaps: "both",
  retainLines: true,
  // plugins: [
  //   '@babel/plugin-transform-runtime'
  // ],
  babelrcRoots
};
babelRegister(babelRegisterOptions);

module.exports = require('./index');