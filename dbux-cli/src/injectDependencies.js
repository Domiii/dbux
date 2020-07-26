import fs from 'fs';
import path from 'path';
import moduleAlias from 'module-alias';

export default function injectDependencies() {
  const dbuxAliases = [
    '@dbux/babel-plugin',
    '@dbux/runtime'
  ];

  const sharedDeps = [
    '@babel/core',
    '@babel/register',
    '@babel/preset-env'
  ];

  // add aliases (since these libraries are not locally available)
  [
    ...dbuxAliases,
    ...sharedDeps
  ].forEach(dep => {
    const target = fs.realpathSync(path.join(__dirname, '..', 'node_modules', dep));
    // console.debug('inject', target);
    moduleAlias.addAlias(dep, target);
  });
}