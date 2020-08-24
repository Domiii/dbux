const path = require('path');
const fs = require('fs');
const moduleAlias = require('module-alias');
const { readPackageJson } = require('../lib/package-util');

// link up all dependencies
linkOwnDependencies();


// ###########################################################################
// linkOwnDependencies
// ###########################################################################

function linkDependencies(deps) {
  for (let [alias, target] of deps) {
    // console.debug('[DBUX module-alias]', alias, '->', target);
    target = fs.realpathSync(target);
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
  const dbuxPathMatch = __dirname.match(/(.*?(dbux-cli|@dbux[\\/]cli))/);
  const dbuxCliRoot = dbuxPathMatch?.[1];
  const dbuxCliFolderName = dbuxPathMatch?.[2];
  if (!dbuxCliRoot) {
    throw new Error(`Unable to find "@dbux/cli" directory in: ${__dirname}`);
  }
  let pkg = readPackageJson(dbuxCliRoot);
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
    // NOTE: in this case, we find ourselves in 
    //    `nodeModulesParent/node_modules/@dbux/cli`  (so we want to go up 3) or...
    //    `ACTUAL_DBUX_ROOT/dbux-cli`                 (so we want to go up 2. NOTE: DBUX_ROOT won't be set in prod though)
    const relativePath = path.join('..', dbuxCliFolderName !== 'dbux-cli' ? '../..' : '');
    nodeModulesParent = path.resolve(dbuxCliRoot, relativePath);
  }

  console.debug('[DBUX] linkOwnDependencies', JSON.stringify({
    __dirname, dbuxCliRoot, nodeModulesParent
  }));

  // check if linkage works
  // console.warn('###########\n\n', DbuxCliRoot, nodeModulesParent, process.env.NODE_ENV);
  // console.warn('  ', require('@babel/plugin-proposal-class-properties'));

  // register remaining (i.e. all) dependencies against `node_modules` folder
  const remainingDeps = depNames.map(name =>
    [name, path.join(nodeModulesParent, 'node_modules', name)]
  );

  // remainingDeps.push([
  //   'socket.io-client', '@dbux/runtime/node_modules/socket.io-client'
  // ]);

  linkDependencies(remainingDeps);
}