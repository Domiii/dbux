import { inspect } from 'util';
import isString from 'lodash/isString';
import isRegExp from 'lodash/isRegExp';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { pathNormalized, renderPath } from '../util/pathUtil';
import { parsePackageName } from '../util/moduleUtil';

// NOTE: aggressive debugging techniques for when console is not available.
// import fs from 'fs';
// const DebugFilePath = '...';
// if (fs.existsSync(DebugFilePath)) {
//   fs.unlinkSync(DebugFilePath);
// }

let Verbose;
const DefaultVerbose = 1;
// const DefaultVerbose = 2;
// const DefaultVerbose = 10;



function debugLog(...args) {
  let msg = `[Dbux] [moduleFilter] ${args.join(' ')}`;
  // msg = colors.gray(msg);

  // eslint-disable-next-line no-console
  console.log(msg);
  // fs.appendFileSync(msg + '\n');
}
function traceLog(...args) {
  let msg = `[Dbux] [moduleFilter] ${args.join(' ')}`;
  // msg = colors.gray(msg);

  // eslint-disable-next-line no-console
  console.trace(msg);
}

function shouldInstrument(input, whitelist, blacklist) {
  const white = (!whitelist?.length || whitelist.some(regexp => regexp.test(input)));
  const black = (!blacklist?.length || !blacklist.some(regexp => regexp.test(input)));
  const result = white && black;
  Verbose > 1 && debugLog('shouldInstrument', input, result, '\n  --',
    JSON.stringify({ white, black, whitelist: whitelist?.map(x => x.toString()), blacklist: blacklist?.map(x => x.toString()) })
  );
  return result;
}

/** ###########################################################################
 * {@link ModuleFilterOptions}
 * ##########################################################################*/

/**
 * hackfix type definition
 */
export class ModuleFilterOptions {
  /**
   * @type {string | RegExp | Array.<string | RegExp>}
   */
  packageWhitelist;
  /**
   * @type {string | RegExp | Array.<string | RegExp>}
   */
  packageBlacklist;
  /**
   * @type {string | RegExp | Array.<string | RegExp>}
   */
  fileWhitelist;
  /**
   * @type {string | RegExp | Array.<string | RegExp>}
   */
  fileBlacklist;
}

/** ###########################################################################
 * {@link moduleFilter}
 * ##########################################################################*/

/**
 * @param {ModuleFilterOptions} options 
 * @param {boolean} includeDefault Is used internally to determine whether we are including or ignoring.
 */
export default function moduleFilter(options, includeDefault) {
  let {
    verbose = -1,
    packageWhitelist,
    packageBlacklist,
    fileWhitelist,
    fileBlacklist
  } = options;

  Verbose = verbose === -1 ? DefaultVerbose : verbose; // hackfix

  const packageWhitelistRegExps = makeFullMatchRegExps(packageWhitelist);
  const packageBlacklistRegExps = makeFullMatchRegExps(packageBlacklist);
  const fileWhitelistRegExps = makeRegExps(fileWhitelist);
  const fileBlacklistRegExps = makeRegExps(fileBlacklist);

  Verbose > 2 && debugLog(
    `pw`, packageWhitelistRegExps?.join(','),
    'pb', packageBlacklistRegExps?.join(','),
    'fw', fileWhitelistRegExps?.join(','),
    'fb', fileBlacklistRegExps?.join(',')
  );

  // Verbose > 1 && debugLog('moduleFilter', 
  //   requireDynamic.resolve/* ._resolveFilename */('@dbux/babel-plugin/package.json')
  // );


  return function _include(modulePath, ...otherArgs) {
    if (!modulePath) {
      Verbose > 2 && traceLog(`no modulePath - otherArgs = ${JSON.stringify(otherArgs)}`);
      return undefined;
    }

    modulePath = pathNormalized(modulePath);

    const unwanted =
      // 1. Dbux's own files should not be babeled for now.
      // NOTE: this could cause problems, if dbux or babel tries to instrument itself.
      // NOTE2: this specifically allows files inside the dbux-code extension folder ('domi.dbux-code-VERSION').
      // future-work: allow including these paths so we can debug Dbux with Dbux.
      // modulePath.match(/((dbux[-]runtime)|(@dbux[/\\]runtime))[/\\]|(\.dbux\.)/) ||
      // modulePath.match(/([/]dbux[-])|([/]@dbux[/])|(\.dbux\.)/) ||
      modulePath.match(/([/]dbux[/]dbux[-].*?[/])|([/]@dbux[/])/) ||

      // 2. some stuff we want to ignore by default
      // TODO: make `.mjs` and @babel path settings configurable
      modulePath.match(/(\.mjs$)|([/]@babel[/])|([/]babel[-]plugin.*[/])/);

    Verbose > 3 && debugLog(`CHECK: "${parsePackageName(modulePath)}" in "${modulePath}"`);

    if (unwanted) {
      reportRegister(modulePath, false, 'unwanted');
      return !includeDefault;
    }

    const packageName = parsePackageName(modulePath);


    // 3. check package name (based on )
    if ((packageName &&
      !shouldInstrument(packageName, packageWhitelistRegExps, packageBlacklistRegExps))) {
      reportRegister(modulePath, false, 'package');
      return !includeDefault;
    }

    // modulePath = modulePath.toLowerCase();

    // 4. check complete path
    const shouldInclude = (!fileWhitelistRegExps.length && !fileBlacklistRegExps.length) ||
      shouldInstrument(modulePath, fileWhitelistRegExps, fileBlacklistRegExps);
    reportRegister(modulePath, shouldInclude, 'file');
    return shouldInclude === includeDefault;
    // return (shouldInclude && includeDefault) || (!shouldInclude && !includeDefault);
  };
}


/** ###########################################################################
 * util
 *  #########################################################################*/

/**
 * Add `^` and `$` (if not exist) to `s` and convert to `RegExp`.
 * @param {string} s 
 */
function makeFullMatchRegExp(s) {
  s = s.trim();
  return new RegExp(`${s[0] === '^' ? '' : '^'}${s}${s[s.length - 1] === '$' ? '' : '$'}`);
}

function makeFullMatchRegExps(list) {
  return makeRegExps(list, makeFullMatchRegExp);
}

function defaultRegexpCreator(s) {
  return new RegExp(s);
}

function makeRegExps(list, toRegexp = defaultRegexpCreator) {
  if (!list) {
    return EmptyArray;
  }

  if (isString(list)) {
    list = list.trim().split(',')
      .map(toRegexp);
  }
  else if (isRegExp(list)) {
    list = [list];
  }
  else {
    list = Array.from(list)
      .map(s => makeRegExps(s, toRegexp));
  }

  // Verbose > 2 && debugLog('RegExps:', inspect(list));

  return list.flat();
}

function reportRegister(modulePath, shouldInclude, what) {
  if (Verbose) {
    if (shouldInclude) {
      modulePath = renderPath(modulePath);
      debugLog(`REGISTER`, modulePath, `(${what})`);
    }
    else if (Verbose > 1) {
      modulePath = renderPath(modulePath);
      debugLog(`no-register`, modulePath, `(${what})`);
    }
  }
}