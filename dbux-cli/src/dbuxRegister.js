import { requireDynamic } from '@dbux/common-node/src/util/requireUtil';
import escapeRegExp from 'lodash/escapeRegExp';
import buildBabelOptions from './buildBabelOptions';

// import './linkOwnDependencies';
import { purgeModuleCache } from './util/moduleCacheUtil';


/**
 * hackfix: get of our own third-party dependencies out of the way, so that @babel/register will not instrument them
 * NOTE: these light up like christmas trees, if we don't do this. They are used by `yargs`.
 */
const defaultPackageBlacklist = escapeRegExp('cliui,ansi-styles');


// babelRegister
export default function dbuxRegister(options) {
  // fix up packageXlists
  options = options || {};
  options.packageBlacklist = options.packageBlacklist ? (options.packageBlacklist + ',') : '';
  options.packageBlacklist += defaultPackageBlacklist;

  // default babel setup
  const babelOptions = buildBabelOptions(options);

  // Add '' as extension, so certain `bin/` files that do not have an extension (e.g. `_mocha`) also get included.
  // NOTE: The extensions array is passed to `pirates`.
  //  (https://github.com/ariporad/pirates/blob/5223d20e54f724780eb73d4d4918f70004d9d8dc/src/index.js#L20)
  // "All subsequent files required by node with the extensions .es6, .es, .jsx, .mjs, and .js will be transformed by Babel."
  //  (see https://babeljs.io/docs/en/babel-register#usage)
  babelOptions.extensions = ['.es6', '.es', '.jsx', '.mjs', '.js', ''];

  // console.debug('[@dbux/cli] dbuxRegister:', JSON.stringify(options));
  // console.debug('[@dbux/cli] babel-register:', !!babelOptions.ignore, JSON.stringify(babelOptions));
  const babelRegister = requireDynamic('@dbux/babel-register-fork').default;
  babelRegister(babelOptions);
  purgeModuleCache();
}
