const path = require('path');
const cliDir = path.join(__dirname, '..');
const dbuxRoot = path.resolve(cliDir + '/..');

module.exports = function dbuxRegister(targetPath = null) {
  const process = require('process');
  process.env.BABEL_DISABLE_CACHE = 1;

  // const dbuxAliases = [
  //   'dbux-babel-plugin',
  //   'dbux-runtime'
  // ];

  // const sharedDeps = [
  //   '@babel/core',
  //   '@babel/register',
  //   '@babel/preset-env'
  // ];

  // // add aliases (since these libraries are not locally available)
  // const moduleAlias = require('module-alias');
  // dbuxAliases.forEach(alias => moduleAlias.addAlias(alias, path.join(dbuxRoot, alias)));
  // sharedDeps.forEach(dep => moduleAlias.addAlias(dep, path.join(dbuxRoot, 'node_modules', dep)));

  // add babelrc roots using some heuristics (used for dev mode dbux runs)
  const babelrcRoots = [];
  if (targetPath) {
    babelrcRoots.push(
      `${targetPath}/..`,
      `${targetPath}/../..`
    );
  }

  const babelRegister = require('@babel/register');
  const dbuxBabelPlugin = require('dbux-babel-plugin');

  // make sure, core stuff is loaded and working before starting instrumentation
  require('dbux-runtime');


  // setup babel-register
  const babelRegisterOptions = {
    ignore: [
      // '**/node_modules/**',
      function shouldPatch(modulePath) {
        // no node_modules
        if (modulePath.match('(node_modules)|(dist)')) {
          // console.warn('dbux-run [babel]', modulePath, false);
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
};