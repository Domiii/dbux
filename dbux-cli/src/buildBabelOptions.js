import dbuxBabelPlugin from '@dbux/babel-plugin';
import { parseNodeModuleName } from '@dbux/common-node/src/util/pathUtil';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import colors from 'colors/safe';
import isString from 'lodash/isString';

// sanity check: make sure, some core stuff is loaded and working before starting instrumentation
// import '@babel/preset-env';
// import injectDependencies from './injectDependencies';

// import buildDefaultBabelOptions from './defaultBabelOptions';

// disable before requiring -> then re-enable dynamically
// console.debug('process.env.BABEL_DISABLE_CACHE =', process.env.BABEL_DISABLE_CACHE);
// process.env.BABEL_DISABLE_CACHE = 1;

const baseBabelOptions = require('../.babelrc');

function debugLog(...args) {
  console.log(colors.gray(`[@dbux/cli] ${args.join(' ')}`));
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


/**
 * TODO: allow custom babel options to also trace configured libraries.
 * For that we need to make the `if` check in the `ignore` function customizable.
 * 
 * @example 
    const re = /node_modules(?![\\/]pug)[\\/]/;
    console.log([
      'node_modules/a',
      'node_modules/a/b',
      'node_modules/pug',
      'node_modules/pug/x'
    ].map((s, i) => ${ i }.${ s } ${ re.test(s) }).join('\n'));
 */

// function otherArgsToString(otherArgs) {
//   return JSON.stringify(otherArgs);
// }

export default function buildBabelOptions(options) {
  let {
    esnext,
    cache,
    sourceRoot,
    dontInjectDbux,
    dontAddPresets,
    dbuxOptions: babelPluginOptions,
    packageWhitelist,
    packageBlacklist,
    verbose = 0,
    runtime = null,
  } = options;

  // if (!cache) {
  //   process.env.BABEL_DISABLE_CACHE = '1';
  // }
  // console.debug('cache =', cache, ', process.env.BABEL_DISABLE_CACHE =', process.env.BABEL_DISABLE_CACHE, JSON.stringify(cache));

  if (dontInjectDbux && !esnext && !verbose) {
    // nothing to babel
    return null;
  }

  // if (process.env.NODE_ENV === 'development') {
  //   injectDependencies();
  // }

  if (!isString(packageWhitelist)) {
    // console.debug(JSON.stringify(packageWhitelist), typeof packageWhitelist);
    packageWhitelist = Array.from(packageWhitelist).join(',');
  }
  
  // packageBlacklist && console.warn('packageBlacklist', packageBlacklist);
  let packageWhitelistRegExps = packageWhitelist?.split(',')
    .map(s => s.trim())
    .map(generateFullMatchRegExp);
  let packageBlacklistRegExps = packageBlacklist?.split(',')
    .map(s => s.trim())
    .map(generateFullMatchRegExp);

  verbose > 1 && debugLog(`pw`, packageWhitelistRegExps?.join(','), 'pb', packageBlacklistRegExps?.join(','));

  // future-work: use Webpack5 magic comments instead
  const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
  verbose > 1 && debugLog(`[@dbux/babel-plugin]`,
    requireFunc.resolve/* ._resolveFilename */('@dbux/babel-plugin/package.json'));

  // setup babel-register
  const baseOptions = esnext ? baseBabelOptions : EmptyObject;
  const babelOptions = {
    ...baseOptions,
    sourceType: 'unambiguous',
    sourceMaps: 'inline',
    sourceRoot,
    retainLines: true,
    // see https://babeljs.io/docs/en/options#parseropts
    parserOpts: { allowReturnOutsideFunction: true },
    ignore: [
      function shouldIgnore(modulePath, ...otherArgs) {
        if (!modulePath) {
          verbose && debugLog(`no modulePath`);
          return undefined;
        }
        if (modulePath.match(/((dbux-runtime)|(@dbux[/\\]runtime))[/\\]/)) {
          // TODO: only debug this if we are targeting dbux directly; else this could cause infinite loops
          return true;
        }

        const matchSkipFileResult = modulePath.match(/([/\\]dist[/\\])|(\.mjs$)/);
        const packageName = parseNodeModuleName(modulePath);

        if (matchSkipFileResult || 
            (packageName && 
          !shouldInstrumentPackage(packageName, packageWhitelistRegExps, packageBlacklistRegExps))) {
          verbose > 1 && debugLog(`no-register`, modulePath);
          return true;
        }

        // modulePath = modulePath.toLowerCase();

        const ignore = false;
        verbose && debugLog(`REGISTER`, modulePath);
        return ignore;
      }
    ]
  };

  if ('cache' in options) {
    babelOptions.cache = cache;
  }

  if (!dontInjectDbux) {
    // add @dbux/babel-plugin
    if (!babelPluginOptions || isString(babelPluginOptions)) {
      babelPluginOptions = babelPluginOptions && JSON.parse(babelPluginOptions) || {};
    }

    // default plugin options
    babelPluginOptions.verbose = babelPluginOptions.verbose || verbose;
    babelPluginOptions.runtime = babelPluginOptions.runtime || runtime;

    babelOptions.plugins = babelOptions.plugins || [];
    babelOptions.plugins.push([dbuxBabelPlugin, babelPluginOptions]);
  }

  if (dontAddPresets) {
    delete babelOptions.presets;
  }

  // console.warn('babelOptions', JSON.stringify(babelOptions, null, 2));

  // TODO: add babel override config here

  return babelOptions;
}
