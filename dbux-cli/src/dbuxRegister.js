import path from 'path';
import fs from 'fs';
import partition from 'lodash/partition';
import babelRegister from '@babel/register';

import { readPackageJson } from '../lib/package-util';

import buildBabelOptions from './util/buildBabelOptions';

const moduleAlias = require('module-alias');


export default function dbuxRegister(options) {
  linkOwnDependencies();

  const babelOptions = buildBabelOptions(options);
  babelRegister(babelOptions);
}

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
  // dependencies['@dbux/cli'] = process.env.DBUX_VERSION;

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
    nodeModulesParent = path.join(DbuxCliRoot, '../..');
  }

  // add socket.io-client, so it will be available to `_dbux_run.js` (TerminalWrapper)
  depNames.push('socket.io-client');

  // register remaining (i.e. all) dependencies against `node_modules` folder
  const remainingDeps = depNames.map(name =>
    [name, path.join(nodeModulesParent, 'node_modules', name)]
  );

  // remainingDeps.push([
  //   'socket.io-client', '@dbux/runtime/node_modules/socket.io-client'
  // ]);

  linkDependencies(remainingDeps);
}