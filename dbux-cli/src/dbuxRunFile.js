
module.exports = function dbuxRunFile(fpath) {
  const path = require('path');
  const moduleAlias = require('module-alias');
  const process = require('process');
  process.env.BABEL_DISABLE_CACHE = 1;

  const cliDir = path.join(__dirname, '..');
  const dbuxRoot = path.resolve(cliDir + '/..');

  const dbuxAliases = [
    'dbux-babel-plugin',
    'dbux-runtime'
  ];

  const sharedDeps = [
    '@babel/core',
    '@babel/register',
    '@babel/preset-env'
  ];

  // add aliases (since these libraries are not locally available)
  dbuxAliases.forEach(alias => moduleAlias.addAlias(alias, path.join(dbuxRoot, alias)));
  sharedDeps.forEach(dep => moduleAlias.addAlias(dep, path.join(dbuxRoot, 'node_modules', dep)));

  const babelrcRoots = [
    `${fpath}/..`,
    `${fpath}/../..`
  ];

  const babelRegister = require('@babel/register');
  const dbuxBabelPlugin = require('dbux-babel-plugin');

  // make sure, core stuff is loaded before starting instrumentation
  require('dbux-runtime');


  // setup babel-register
  const babelRegisterOptions = {
    ignore: [
      // '**/node_modules/**',
      function (fpath) {
        // no node_modules
        if (fpath.match('(node_modules)|(dist)')) {
          return true;
        }

        fpath = fpath.toLowerCase();

        const shouldIgnore = false;
        console.warn('dbux-run [babel]', fpath, !shouldIgnore);
        return shouldIgnore;
      }
    ],
    sourceMaps: 'inline',
    plugins: [
      dbuxBabelPlugin
    ],
    presets: [
      "@babel/preset-env"
    ],
    babelrcRoots
  };
  babelRegister(babelRegisterOptions);

  // go time!
  if (!path.isAbsolute(fpath)) {
    fpath = path.join(cliDir, fpath);
  }
  require(fpath);
}