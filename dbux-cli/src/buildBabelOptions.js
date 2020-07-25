import process from 'process';
import dbuxBabelPlugin from '@dbux/babel-plugin';
import EmptyObject from '@dbux/common/src/util/EmptyObject';

// sanity check: make sure, some core stuff is loaded and working before starting instrumentation
import '@babel/preset-env';

// import buildDefaultBabelOptions from './defaultBabelOptions';
const baseBabelOptions = require('../babel.config');

export default function buildBabelOptions(options) {
  process.env.BABEL_DISABLE_CACHE = 1;

  const {
    vanilla,
    injectDbux,
    addPresets
  } = options;

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
  const baseOptions = vanilla ? EmptyObject : baseBabelOptions;
  const babelOptions = {
    ...baseOptions,

    sourceMaps: 'inline',
    ignore: [
      // '**/node_modules/**',
      function shouldIgnore(modulePath) {
        if (!modulePath) {
          return undefined;
        }
        
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
    ]
  };

  if (injectDbux) {
    babelOptions.plugins = babelOptions.plugins || [];
    babelOptions.plugins.push(dbuxBabelPlugin);
  }

  if (!addPresets) {
    delete babelOptions.presets;
  }

  // TODO: add babel override config here

  return babelOptions;
}