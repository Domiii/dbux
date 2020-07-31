import babelRegister from '@babel/register';

import buildBabelOptions from './util/buildBabelOptions';

const moduleAlias = require('module-alias');


export default function dbuxRegister(options) {
  linkOwnDependencies();

  const babelOptions = buildBabelOptions(options);
  babelRegister(babelOptions);
}

/**
 * GOAL: Make own dependencies available, even if cwd is not local.
 */
function linkOwnDependencies() {
  // const DBUX_ROOT = process.env.DBUX_ROOT;
  // if (!DBUX_ROOT) {
  //   throw new Error('[INTERNAL ERROR] DUX_ROOT not defined');
  // }

  // add all of dbux/cli's node_modules via `module-alias`
  const dbuxDeps = [
    'common',
    'cli',
    'babel-plugin',
    'runtime'
  ];



  // let pkg = readPackageJson(path.join(DBUX_ROOT, 'dbux-cli'));

  // TODO: add self
  // TODO: add all dependencies
  // TODO: if dev mode -> link dbux to root folder
  //  const pattern = /@dbux\//;
  // dependencies.filter(dep => pattern.test(dep))

  // [
  //   ...dbuxAliases
  // ].forEach(name => {
  //   // NOTE: projectsRoot is a sibling folder of the mono repo
  //   // const relPath = process.env.NODE_ENV === 'production' ? [] : ['..'];
  //   const alias = `@dbux/${name}`;
  //   const target = fs.realpathSync(path.join(DBUX_ROOT, `dbux-${name}`));
  //   console.debug('[DBUX inject]', alias, '->', target);
  //   moduleAlias.addAlias(alias, target);
  // });
}