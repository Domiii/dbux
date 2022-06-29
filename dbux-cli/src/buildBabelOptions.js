import dbuxBabelPlugin from '@dbux/babel-plugin';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import makeIgnore from '@dbux/common-node/src/filters/makeIgnore';
import requireDynamic from '@dbux/common/src/util/requireDynamic';
import colors from 'colors/safe';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import NestedError from '@dbux/common/src/NestedError';

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
    verbose = 0,
    runtime = null,
    targets
  } = options;

  // if (!cache) {
  //   process.env.BABEL_DISABLE_CACHE = '1';
  // }
  // console.debug('cache =', cache, ', process.env.BABEL_DISABLE_CACHE =', process.env.BABEL_DISABLE_CACHE, JSON.stringify(cache));

  if (dontInjectDbux && !esnext && !verbose) {
    // nothing to babel
    return null;
  }

  targets = makeTargets(targets);

  // if (process.env.NODE_ENV === 'development') {
  //   injectDependencies();
  // }

  // future-work: use Webpack5 magic comments instead
  verbose > 1 && debugLog(`[@dbux/babel-plugin]`,
    requireDynamic.resolve/* ._resolveFilename */('@dbux/babel-plugin/package.json'));

  // Build ignore config using whitelist/blacklist options
  const moduleFilterOptions = {
    ...options,
    verbose: -1
  };
  const ignore = [
    makeIgnore(moduleFilterOptions)
  ];

  // setup babel-register
  const baseOptions = esnext ? baseBabelOptions : EmptyObject;
  const babelOptions = {
    ...baseOptions,
    /**
     * Force target (to `node`) so it won't try to aim for browser compatability.
     * @see https://github.com/browserslist/browserslist/issues/629#issuecomment-984459369
     */
    targets,

    ignore,

    browserslistConfigFile: false,
    sourceType: 'unambiguous',
    sourceMaps: false,
    sourceRoot,
    retainLines: true,
    // see https://babeljs.io/docs/en/options#parseropts
    parserOpts: { allowReturnOutsideFunction: true },
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
    // babelPluginOptions.ignore = ignore; // NOTE: if we don't pass `ignore` to `babel`, it will ignore node_modules by default

    babelOptions.plugins = babelOptions.plugins || [];
    babelOptions.plugins.push([dbuxBabelPlugin, babelPluginOptions]);
  }

  // console.warn(JSON.stringify(babelOptions), dontAddPresets);
  if (dontAddPresets) {
    // NOTE: only makes a difference in combination with `--esnext`
    delete babelOptions.presets;
  }

  // console.warn('babelOptions', JSON.stringify(babelOptions, null, 2));

  // TODO: add babel override config here

  return babelOptions;
}

/** ###########################################################################
 * util
 * ##########################################################################*/

function makeTargets(targets) {
  if (isString(targets)) {
    try {
      targets = JSON.parse(targets);
      if (targets !== null && !isPlainObject(targets)) {
        throw new Error(`expected JSON string representing an object. Found: ${typeof targets}`);
      }
    }
    catch (err) {
      throw new NestedError(`invalid "targets" option cannot be parsed (targets="${targets}")`, err);
    }
  }
  if (!targets) {
    targets = {
      node: 16
    };
  }
  return targets;
}
