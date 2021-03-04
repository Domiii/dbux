import process from 'process';
import dbuxBabelPlugin from '@dbux/babel-plugin';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import defaultsDeep from 'lodash/defaultsDeep';
import colors from 'colors/safe';

// sanity check: make sure, some core stuff is loaded and working before starting instrumentation
// import '@babel/preset-env';
// import injectDependencies from './injectDependencies';

// import buildDefaultBabelOptions from './defaultBabelOptions';
const baseBabelOptions = require('../../.babelrc');

function debugLog(...args) {
  console.log(colors.gray(args.join(' ')));
  // if (args.length > 1) {
  //   const [arg0, ...moreArgs] = args;

  //   const gray = '\x1b[2m';
  //   const reset = '\x1b[0m';
  //   console.log(`${gray}${arg0}`, ...moreArgs, reset);
  // }
  // else {
  //   console.log();
  // }
}

function batchTestRegExp(regexps, target) {
  return regexps.some(regexp => regexp.test(target));
}

export default function buildBabelOptions(options) {
  process.env.BABEL_DISABLE_CACHE = 1;

  const {
    esnext,
    dontInjectDbux,
    dontAddPresets,
    dbuxOptions: dbuxOptionsString,
    verbose = 0
  } = options;

  let { packageWhitelist } = options;

  if (dontInjectDbux && !esnext) {
    // nothing to babel
    return null;
  }

  const dbuxOptions = dbuxOptionsString && JSON.parse(dbuxOptionsString) || undefined;
  defaultsDeep(dbuxOptions || {}, {
    verbose
  });

  // if (process.env.NODE_ENV === 'development') {
  //   injectDependencies();
  // }

  if (!Array.isArray(packageWhitelist)) packageWhitelist = [packageWhitelist];
  const packageWhitelistRegExps = packageWhitelist.map(packageName => new RegExp(`^${packageName}$`));

  // setup babel-register
  const baseOptions = esnext ? baseBabelOptions : EmptyObject;
  const babelOptions = {
    ...baseOptions,
    sourceType: 'unambiguous',
    sourceMaps: 'inline',
    ignore: [
      // '**/node_modules/**',
      function shouldIgnore(modulePath) {
        if (!modulePath) {
          return undefined;
        }

        const matchSkipFileResult = modulePath.match(/dist|\.mjs/);
        const matchResult = modulePath.match(/(?<=node_modules\/)(?!node_modules)(?<packageName>[^/]+)(?=\/(?!node_modules).*)/);
        const packageName = matchResult ? matchResult.groups.packageName : null;

        if (matchSkipFileResult || (packageName && !batchTestRegExp(packageWhitelistRegExps, packageName))) {
          verbose > 1 && debugLog(`[Dbux] no-register`, modulePath);
          return true;
        }

        modulePath = modulePath.toLowerCase();

        const ignore = false;
        verbose && debugLog(`[Dbux] REGISTER`, modulePath);
        return ignore;
      }
    ]
  };

  if (!dontInjectDbux) {
    babelOptions.plugins = babelOptions.plugins || [];
    babelOptions.plugins.push([dbuxBabelPlugin, dbuxOptions]);
  }

  if (dontAddPresets) {
    delete babelOptions.presets;
  }

  // TODO: add babel override config here

  return babelOptions;
}