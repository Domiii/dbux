import process from 'process';
import dbuxBabelPlugin from '@dbux/babel-plugin';
import EmptyObject from '@dbux/common/src/util/EmptyObject';

// sanity check: make sure, some core stuff is loaded and working before starting instrumentation
// import '@babel/preset-env';
// import injectDependencies from './injectDependencies';

// import buildDefaultBabelOptions from './defaultBabelOptions';
const baseBabelOptions = require('../../.babelrc');

export default function buildBabelOptions(options) {
  process.env.BABEL_DISABLE_CACHE = 1;

  const {
    vanilla,
    dontInjectDbux,
    dontAddPresets
  } = options;

  // if (process.env.NODE_ENV === 'development') {
  //   injectDependencies();
  // }

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
          console.debug(`dbux-register ignore`, modulePath);
          return true;
        }

        modulePath = modulePath.toLowerCase();

        const ignore = false;
        console.debug(`dbux-register include`, modulePath);
        return ignore;
      }
    ]
  };

  if (!dontInjectDbux) {
    babelOptions.plugins = babelOptions.plugins || [];
    babelOptions.plugins.push(dbuxBabelPlugin);
  }

  if (dontAddPresets) {
    delete babelOptions.presets;
  }

  // TODO: add babel override config here

  return babelOptions;
}