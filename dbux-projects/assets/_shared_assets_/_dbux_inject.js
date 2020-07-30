/**
 * NOTE: this file is the first thing that executes inside the instrumented application to
 * link up dependencies.
 */

// eslint-disable-next-line prefer-destructuring
const DBUX_ROOT = process.env.DBUX_ROOT;
if (!DBUX_ROOT) {
  // nothing to do
  return;
}

const fs = require('fs');
const path = require('path');

// NOTE: 
const moduleAlias = require('module-alias');

(function dbuxInject() {
  const dbuxAliases = [
    'cli',
    'babel-plugin',
    'runtime'
  ];

  // const sharedDeps = [
  //   '@babel/core',
  //   '@babel/register',
  //   '@babel/preset-env'
  // ];

  // add aliases (since these libraries are not locally available)
  [
    ...dbuxAliases
  ].forEach(name => {
    // NOTE: projectsRoot is a sibling folder of the mono repo
    // const relPath = process.env.NODE_ENV === 'production' ? [] : ['..'];
    const alias = `@dbux/${name}`;
    const target = fs.realpathSync(path.join(DBUX_ROOT, `dbux-${name}`));
    // console.debug('[DBUX inject]', alias, '->', target);
    moduleAlias.addAlias(alias, target);
  });


  // dbux go!
  require('');
})();