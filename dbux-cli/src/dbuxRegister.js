import process from 'process';
import babelRegister from '@babel/register';
import dbuxBabelPlugin from '@dbux/babel-plugin';

// make sure, core stuff is loaded and working before starting instrumentation
import '@babel/preset-env';
import '@dbux/runtime';

import buildDefaultBabelOptions from './defaultBabelOptions';

module.exports = function dbuxRegister(targetPath = null) {
  process.env.BABEL_DISABLE_CACHE = 1;

  // const dbuxAliases = [
  //   'dbux-babel-plugin',
  //   'dbux-runtime'
  // ];

  // const sharedDeps = [
  //   '@babel/core',
  //   '@babel/register',
  //   '@babel/preset-env'
  // ];

  // // add aliases (since these libraries are not locally available)
  // const moduleAlias = require('module-alias');
  // dbuxAliases.forEach(alias => moduleAlias.addAlias(alias, path.join(dbuxRoot, alias)));
  // sharedDeps.forEach(dep => moduleAlias.addAlias(dep, path.join(dbuxRoot, 'node_modules', dep)));


  // setup babel-register
  const babelRegisterOptions = {
    ...buildDefaultBabelOptions(targetPath),
    
    cache: false,
    ignore: [
      // '**/node_modules/**',
      function shouldIgnore(modulePath) {
        // no node_modules
        if (modulePath.match('(node_modules)|(dist)')) {
          // console.debug(`dbux-register ignore`, modulePath);
          return true;
        }

        modulePath = modulePath.toLowerCase();

        const ignore = false;
        // console.debug(`dbux-register include`, !ignore, modulePath);
        return ignore;
      }
    ],
    plugins: [
      dbuxBabelPlugin
    ]
  };
  
  babelRegister(babelRegisterOptions);
};