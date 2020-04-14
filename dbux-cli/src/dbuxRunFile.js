
module.exports = function dbuxRunFile(targetPath) {
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
    `${targetPath}/..`,
    `${targetPath}/../..`
  ];

  const babelRegister = require('@babel/register');
  const dbuxBabelPlugin = require('dbux-babel-plugin');

  // make sure, core stuff is loaded and working before starting instrumentation
  require('dbux-runtime');


  // setup babel-register
  const babelRegisterOptions = {
    ignore: [
      // '**/node_modules/**',
      function (modulePath) {
        // no node_modules
        if (modulePath.match('(node_modules)|(dist)')) {
          return true;
        }

        modulePath = modulePath.toLowerCase();

        const shouldIgnore = false;
        console.warn('dbux-run [babel]', modulePath, !shouldIgnore);
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
  if (!path.isAbsolute(targetPath)) {
    targetPath = path.join(cliDir, targetPath);
  }

  try {
    require(targetPath);
  }
  catch (err) {
    console.error('ERROR when running instrumented code:\n ', err && err.stack || err);
  }
};