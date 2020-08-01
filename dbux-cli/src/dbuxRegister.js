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


  // NOTE: after webpack build, __dirname is actually `dist`
  const DbuxCliRoot = path.resolve('..');
  let pkg = readPackageJson(DbuxCliRoot);
  const { dependencies } = pkg;
  let depNames = Object.keys(dependencies);

  // add self
  depNames.push('@dbux/cli');
  // dependencies['@dbux/cli'] = process.env.DBUX_VERSION;

  // register all dependencies
  const dbuxPackagePattern = /@dbux\//;


  let nodeModulesParent;
  if (process.env.NODE_ENV === 'development') {
    // register dbux dependencies via their development folder
    // NOTE: in dev folder, dependencies are hoisted to root
    nodeModulesParent = process.env.DBUX_ROOT;

    let dbuxDepNames;
    [dbuxDepNames, depNames] = partition(depNames, dep => dbuxPackagePattern.test(dep));
    dbuxDepNames = dbuxDepNames.map(name => name.match(/@dbux\/(.*)/)[1]);

    linkDependencies(dbuxDepNames.map(name => 
      [`@dbux/${name}`, path.join(process.env.DBUX_ROOT, `dbux-${name}`)]
    ));
  }
  else {
    // production mode -> `@dbux/cli` stand-alone installation
    nodeModulesParent = DbuxCliRoot;
  }

  // register remaining dependencies against `node_modules` folder
  linkDependencies(depNames.map(name =>
    [ TODO ]
  ));
}