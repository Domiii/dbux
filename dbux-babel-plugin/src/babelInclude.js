const path = require('path');
const dbuxRoot = path.resolve(__dirname + '/../..');

const babelRegisterOptions = {
  ignore: [
    // '**/node_modules/**',
    function (fpath) {
      // console.log('[babel-register]', fpath);
      // return false;

      // no node_modules
      if (fpath.match('node_modules')) {
        return true;
      }

      // only dbux plugin + common
      let prefix = path.join(dbuxRoot, 'dbux-') + '((common)|(babel))';

      // fix: backslashes on windows
      prefix = prefix.replace(/\\/g, '\\\\');

      // fix: sometimes drive letters on windows are capitalized, sometimes not
      prefix = prefix.toLowerCase();
      fpath = fpath.toLowerCase();

      const shouldIgnore = !fpath.match(prefix);
      // console.warn(fpath, !shouldIgnore, prefix);
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
  babelrcRoots: [
    path.join(__dirname, '..'),
    path.join(dbuxRoot, "dbux-common"),
    path.join(dbuxRoot, "dbux-runtime")
    // dbuxRoot + "/dbux-runtime"
  ]
};
const babelRegister = require('@babel/register');
babelRegister(babelRegisterOptions);

module.exports = require('./index');