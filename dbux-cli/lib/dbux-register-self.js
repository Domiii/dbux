const process = require('process');
const babelRegister = require('@babel/register');

const path = require('path');
const fs = require('fs');
const moduleAlias = require('module-alias');
const { readPackageJson } = require('./package-util');

// TODO: enable cache in production mode
process.env.BABEL_DISABLE_CACHE = 1;

const defaultBabelOptions = require('../babel.config');

// 1. link up all dependencies
linkOwnDependencies();

// 2. babel-register (could also use babel-node instead)
const babelRegisterOptions = {
  ...defaultBabelOptions,
  sourceMaps: 'inline',
  ignore: [
    // '**/node_modules/**',
    function shouldIgnore(modulePath) {
      let include = modulePath.match(/((@dbux[\\/])|(dbux-.*?))src[\\/]/);
      if (include) {
        // throw new Error('x');
        console.debug(`[dbux-cli] register-self include`, modulePath);
        return false;
      }

      // include = !!modulePath.match(/(node_modules|dist)[\\/]/);
      return true;
    }
  ]
};
babelRegister(babelRegisterOptions);


// ###########################################################################
// linkOwnDependencies
// ###########################################################################

function linkDependencies(deps) {
  for (let [alias, target] of deps) {
    target = fs.realpathSync(target);
    console.debug('[DBUX module-alias]', alias, '->', target);
    moduleAlias.addAlias(alias, target);
  }
}

/**
 * Make `@dbux/cli`'s own dependencies (and itself) available, even if cwd does not contain them.
 */
function linkOwnDependencies() {
  // const DBUX_ROOT = process.env.DBUX_ROOT;
  // if (!DBUX_ROOT) {
  //   throw new Error('[INTERNAL ERROR] DUX_ROOT not defined');
  // }


  // NOTE: in webpack build, __dirname is actually dirname of the entry point
  // const DbuxCliRoot = path.resolve(__dirname, '..');
  const DbuxCliRoot = __dirname.match(/(.*dbux-cli)/)[1];
  let pkg = readPackageJson(DbuxCliRoot);
  const { dependencies } = pkg;
  let depNames = Object.keys(dependencies);

  // add self
  depNames.push('@dbux/cli');

  // add socket.io-client, so it will be available to `_dbux_run.js` (TerminalWrapper)
  depNames.push('socket.io-client');

  // register all dependencies
  let nodeModulesParent;
  if (process.env.NODE_ENV === 'development') {
    // link dbux dependencies to monorepo root development folder
    // NOTE: in monorepo, dependencies are hoisted to root
    // NOTE: in monorepo, packages are also linked to root `node_modules` folder
    nodeModulesParent = process.env.DBUX_ROOT;

    // let dbuxDepNames;
    // const dbuxPackagePattern = /@dbux\//;
    // [dbuxDepNames, depNames] = partition(depNames, dep => dbuxPackagePattern.test(dep));
    // dbuxDepNames = dbuxDepNames.map(name => name.match(/@dbux\/(.*)/)[1]);

    // linkDependencies(dbuxDepNames.map(name =>
    //   [`@dbux/${name}`, path.join(process.env.DBUX_ROOT, `dbux-${name}`)]
    // ));
  }
  else {
    // production mode -> `@dbux/cli` stand-alone installation
    // NOTE: in this case, we find ourselves in `nodeModulesParent/node_modules/dbux-cli`
    nodeModulesParent = path.resolve(DbuxCliRoot, '../..');
  }

  console.warn('XX', DbuxCliRoot, nodeModulesParent, process.env.NODE_ENV);

  // register remaining (i.e. all) dependencies against `node_modules` folder
  const remainingDeps = depNames.map(name =>
    [name, path.join(nodeModulesParent, 'node_modules', name)]
  );

  // remainingDeps.push([
  //   'socket.io-client', '@dbux/runtime/node_modules/socket.io-client'
  // ]);

  linkDependencies(remainingDeps);
}