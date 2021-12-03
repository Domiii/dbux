
import isString from 'lodash/isString';
import { parseNodeModuleName } from '@dbux/common-node/src/util/pathUtil';
import { requireDynamic } from '@dbux/common-node/src/util/requireUtil';
import { isRegExp } from 'lodash';

const Verbose = 0;
// const Verbose = 1;

function debugLog(...args) {
  let msg = `[@dbux/babel-plugin][moduleFilter] ${args.join(' ')}`;
  // msg = colors.gray(msg);

  // eslint-disable-next-line no-console
  console.log(msg);
}

function shouldInstrumentPackage(packageName, whitelist, blacklist) {
  const white = (!whitelist || whitelist.some(regexp => regexp.test(packageName)));
  const black = (!blacklist || !blacklist?.some(regexp => regexp.test(packageName)));
  // console.log('shouldInstrumentPackage', packageName, { white, black, whitelist });
  return white && black;
}

/** ###########################################################################
 * {@link moduleFilter}
 * ##########################################################################*/

export default function moduleFilter(options, includeDefault) {
  let {
    packageWhitelist,
    packageBlacklist,
    fileWhitelist,
    fileBlacklist
  } = options;

  const packageWhitelistRegExps = makeFullMatchRegExps(packageWhitelist);
  const packageBlacklistRegExps = makeFullMatchRegExps(packageBlacklist);
  const fileWhitelistRegExps = makeRegExps(fileWhitelist);
  const fileBlacklistRegExps = makeRegExps(fileBlacklist);

  Verbose > 1 && debugLog(`pw`, packageWhitelistRegExps?.join(','), 'pb', packageBlacklistRegExps?.join(','));

  // Verbose > 1 && debugLog('moduleFilter', 
  //   requireDynamic.resolve/* ._resolveFilename */('@dbux/babel-plugin/package.json')
  // );


  return function _include(modulePath, ...otherArgs) {
    if (!modulePath) {
      Verbose && debugLog(`no modulePath - otherArgs = ${otherArgs}`);
      return undefined;
    }
    if (modulePath.match(/((dbux-runtime)|(@dbux[/\\]runtime))[/\\]/)) {
      // future-work: only debug these paths if we are targeting dbux directly; else this could cause infinite loops
      return !includeDefault;
    }

    // TODO: make `dist` and `.mjs` path settings configurable
    const matchSkipFileResult = modulePath.match(/([/\\]dist[/\\])|(\.mjs$)/);
    const packageName = parseNodeModuleName(modulePath);

    // console.log('matchSkipFileResult', modulePath, packageName, matchSkipFileResult);

    if (matchSkipFileResult ||
      (packageName &&
        !shouldInstrumentPackage(packageName, packageWhitelistRegExps, packageBlacklistRegExps))) {
      reportRegister(modulePath, false);
      return !includeDefault;
    }

    // modulePath = modulePath.toLowerCase();

    // const shouldInclude = includeDefault;
    const shouldInclude = shouldInstrumentPackage(modulePath, fileWhitelistRegExps, fileBlacklistRegExps);
    reportRegister(modulePath, shouldInclude);
    return shouldInclude;
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

function makeRegExps(list, toRegexp = RegExp) {
  if (!list) {
    return list;
  }

  if (isString(list)) {
    list = list.trim().split(',')
      .map(toRegexp);
  }
  else {
    list = Array.from(list).join(',')
      .map(s => isRegExp(s) ? s : toRegexp(s));
  }

  return list;
}


function reportRegister(modulePath, shouldInclude) {
  if (Verbose) {
    if (shouldInclude) {
      debugLog(`REGISTER`, modulePath);
    }
    else if (Verbose > 1) {
      debugLog(`no-register`, modulePath);
    }
  }
}