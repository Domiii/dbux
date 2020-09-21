const path = require('path');
const fs = require('fs');
const colors = require('colors/safe');
const moduleAlias = require('module-alias');
const { readPackageJson } = require('../lib/package-util');
const { getDependencyRoot } = require('../lib/dbux-folders');

// link up all dependencies
linkOwnDependencies();


// ###########################################################################
// linkOwnDependencies
// ###########################################################################

function linkDependencies(deps) {
  console.debug('[DBUX module-alias]', deps.map(([alias, target]) => `${alias} -> ${target}`));
  for (let [alias, target] of deps) {
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
  const dependencyRoot = getDependencyRoot();
  if (!dependencyRoot) {
    throw new Error(`File is not (but must be) in "@dbux/cli" directory: ${getDependencyRoot()}`);
  }
  // read `@dbux/cli`'s own dependencies
  let pkg = readPackageJson(path.join(__dirname, '../..'));
  const { dependencies } = pkg;
  let depNames = Object.keys(dependencies);

  // add self
  depNames.push('@dbux/cli');

  // add socket.io-client
  // depNames.push('socket.io-client');

  // register all dependencies
  
  const msg = `[DBUX] linkOwnDependencies ${JSON.stringify({
    __dirname, dependencyRoot
  })}`;
  console.debug(colors.gray(msg));

  // check if linkage works
  // console.warn('###########\n\n', dependencyRoot, process.env.NODE_ENV);
  // console.warn('  ', require('@babel/plugin-proposal-class-properties'));

  // link dependencies against their folders in the `node_modules` folder
  const absoluteDeps = depNames.map(name =>
    [name, path.join(dependencyRoot, 'node_modules', name)]
  );
  linkDependencies(absoluteDeps);
}