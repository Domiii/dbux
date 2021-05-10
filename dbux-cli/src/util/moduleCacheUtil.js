/**
 * @file
 * @see https://stackoverflow.com/a/14801711/2228771
 */

/**
 * 
 */
export function purgeModuleCache() {
  for (const fpath in require.cache) {
    const mod = require.cache[fpath];
    mod.constructor._pathCache = {};
    delete require.cache[fpath];
  }

  // // Remove cached paths to the module.
  // Object.keys(module.constructor._pathCache).forEach(function (cacheKey) {
  //   if (cacheKey.indexOf(moduleName) > 0) {
  //     delete module.constructor._pathCache[cacheKey];
  //   }
  // });
}