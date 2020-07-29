import fs from 'fs';
import path from 'path';
import moduleAlias from 'module-alias';

export default function injectDependencies() {
  const dbuxAliases = [
    '@dbux/babel-plugin',
    '@dbux/runtime'
  ];

  // const sharedDeps = [
  //   '@babel/core',
  //   '@babel/register',
  //   '@babel/preset-env'
  // ];

  // add aliases (since these libraries are not locally available)
  [
    ...dbuxAliases
  ].forEach(dep => {
    // NOTE: Dependencies are hoisted at the root in dev mode
    const relPath = process.env.NODE_ENV === 'production' ? [] : ['..'];
    const target = fs.realpathSync(path.join(__dirname, '..', ...relPath, 'node_modules', dep));
    // console.debug('inject', target);
    moduleAlias.addAlias(dep, target);
  });
}