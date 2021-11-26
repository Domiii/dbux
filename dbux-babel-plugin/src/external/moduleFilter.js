
import isString from 'lodash/isString';
import { parseNodeModuleName } from '@dbux/common-node/src/util/pathUtil';
import { requireDynamic } from '@dbux/common-node/src/util/requireUtil';

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

export default function moduleFilter(options, includeDefault) {
  let {
    packageWhitelist,
    packageBlacklist
  } = options;

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

  Verbose > 1 && debugLog(`pw`, packageWhitelistRegExps?.join(','), 'pb', packageBlacklistRegExps?.join(','));

  // future-work: use Webpack5 magic comments instead
  Verbose > 1 && debugLog(
    requireDynamic.resolve/* ._resolveFilename */('@dbux/babel-plugin/package.json')
  );


  return function _include(modulePath, ...otherArgs) {
    if (!modulePath) {
      Verbose && debugLog(`no modulePath - otherArgs = ${otherArgs}`);
      return undefined;
    }
    if (modulePath.match(/((dbux-runtime)|(@dbux[/\\]runtime))[/\\]/)) {
      // TODO: only debug this if we are targeting dbux directly; else this could cause infinite loops
      return !includeDefault;
    }

    // TODO: make this dist and .mjs stuff customizable
    const matchSkipFileResult = modulePath.match(/([/\\]dist[/\\])|(\.mjs$)/);
    const packageName = parseNodeModuleName(modulePath);

    // console.log('matchSkipFileResult', modulePath, packageName, matchSkipFileResult);

    if (matchSkipFileResult ||
      (packageName &&
        !shouldInstrumentPackage(packageName, packageWhitelistRegExps, packageBlacklistRegExps))) {
      Verbose > 1 && debugLog(`no-register`, modulePath);
      return !includeDefault;
    }

    // modulePath = modulePath.toLowerCase();

    const include = includeDefault;
    Verbose && debugLog(`REGISTER`, modulePath);
    return include;
  };
}



/**
 * Add `^` and `$` (if not exist) to `s` and convert to `RegExp`.
 * @param {string} s 
 */
function generateFullMatchRegExp(s) {
  return new RegExp(`${s[0] === '^' ? '' : '^'}${s}${s[s.length - 1] === '$' ? '' : '$'}`);
}