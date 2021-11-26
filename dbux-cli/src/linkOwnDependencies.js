import path from 'path';
import colors from 'colors/safe';
import { readPackageJson } from '../lib/package-util';
import { getDependencyRoot, getDbuxCliRoot } from '../lib/dbux-folders';
import linkDependencies from './linkDependencies';

// link up all dependencies
linkOwnDependencies();


// ###########################################################################
// linkOwnDependencies
// ###########################################################################

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
    throw new Error(`Could not resolve dependency root. Is this file not in "@dbux/cli" directory? (${__filename})`);
  }
  
  // read `@dbux/cli`'s own dependencies
  const targetFolder = getDbuxCliRoot();
  let pkg = readPackageJson(targetFolder);
  const { dependencies } = pkg;
  let depNames = Object.keys(dependencies);

  // add self
  depNames.push('@dbux/cli');

  // add socket.io-client
  // depNames.push('socket.io-client');

  // register all dependencies
  
  // const msg = `[Dbux] linkOwnDependencies ${JSON.stringify({
  //   targetFolder, dependencyRoot
  // })}`;
  // console.debug(colors.gray(msg));

  // check if linkage works
  // console.warn('###########\n\n', dependencyRoot, process.env.NODE_ENV);
  // console.warn('  ', require('@babel/plugin-proposal-optional-chaining'));

  // link dependencies against their folders in the `node_modules` folder
  const absoluteDeps = depNames.map(name =>
    [name, path.join(dependencyRoot, 'node_modules', name)]
  );
  linkDependencies(absoluteDeps);

  // // eslint-disable-next-line camelcase
  // depNames.forEach(n => requireDynamic(n));
}