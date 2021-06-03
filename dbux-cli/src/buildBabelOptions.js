import process from 'process';
import dbuxBabelPlugin from '@dbux/babel-plugin';
import { parseNodeModuleName } from '@dbux/common-node/src/util/pathUtil';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import defaultsDeep from 'lodash/defaultsDeep';
import colors from 'colors/safe';

// sanity check: make sure, some core stuff is loaded and working before starting instrumentation
// import '@babel/preset-env';
// import injectDependencies from './injectDependencies';

// import buildDefaultBabelOptions from './defaultBabelOptions';
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
 * Add `^` and `$` (if not exist) to `s` and convert to `RegExp`.
 * @param {string} s 
 */
function generateFullMatchRegExp(s) {
  return new RegExp(`${s[0] === '^' ? '' : '^'}${s}${s[s.length - 1] === '$' ? '' : '$'}`);
}

function batchTestRegExp(regexps, target) {
  return regexps.some(regexp => regexp.test(target));
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

function otherArgsToString(otherArgs) {
  return JSON.stringify(otherArgs);
}

export default function buildBabelOptions(options) {
  process.env.BABEL_DISABLE_CACHE = 1;

  const {
    esnext,
    dontInjectDbux,
    dontAddPresets,
    dbuxOptions: dbuxOptionsString,
    packageWhitelist,
    verbose = 0,
    runtime = null
  } = options;

  // console.log(`buildBabelOptions: verbose=${verbose}, runtime=${runtime}`);

  if (dontInjectDbux && !esnext && !verbose) {
    // nothing to babel
    return null;
  }

  const dbuxOptions = dbuxOptionsString && JSON.parse(dbuxOptionsString) || {};
  defaultsDeep(dbuxOptions, {
    verbose,
    runtime: runtime
  });

  // if (process.env.NODE_ENV === 'development') {
  //   injectDependencies();
  // }

  const packageWhitelistRegExps = packageWhitelist
    .split(',')
    .map(s => s.trim())
    .map(generateFullMatchRegExp);

  verbose > 1 && debugLog(`packageWhitelist`, packageWhitelistRegExps.join(','));

  const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
  verbose > 1 && debugLog(`[@dbux/babel-plugin]`,
    requireFunc.resolve/* ._resolveFilename */('@dbux/babel-plugin/package.json'));

  // setup babel-register
  const baseOptions = esnext ? baseBabelOptions : EmptyObject;
  const babelOptions = {
    ...baseOptions,
    sourceType: 'unambiguous',
    sourceMaps: 'inline',
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

        if (matchSkipFileResult || (packageName && !batchTestRegExp(packageWhitelistRegExps, packageName))) {
          verbose > 1 && debugLog(`no-register`, modulePath);
          return true;
        }

        // modulePath = modulePath.toLowerCase();

        const ignore = dontInjectDbux;
        verbose && debugLog(`REGISTER`, modulePath);
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

  // console.warn('babelOptions', JSON.stringify(babelOptions, null, 2));

  // TODO: add babel override config here

  return babelOptions;
}
