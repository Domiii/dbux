import buildBabelOptions from './buildBabelOptions';

// import './linkOwnDependencies';
import { purgeModuleCache } from './util/moduleCacheUtil';


// babelRegister
export default function dbuxRegister(options) {
  const babelOptions = buildBabelOptions(options);

  // Add '' as extension, so certain `bin/` files that do not have an extension (e.g. `_mocha`) also get included.
  // NOTE: The extensions array is passed to `pirates`.
  //  (https://github.com/ariporad/pirates/blob/5223d20e54f724780eb73d4d4918f70004d9d8dc/src/index.js#L20)
  // "All subsequent files required by node with the extensions .es6, .es, .jsx, .mjs, and .js will be transformed by Babel."
  //  (see https://babeljs.io/docs/en/babel-register#usage)
  babelOptions.extensions = ['.es6', '.es', '.jsx', '.mjs', '.js', ''];

  console.debug('babelRegister', JSON.stringify(options));
  purgeModuleCache();
  const babelRegister = require('@babel/register').default;
  babelRegister(babelOptions);
}