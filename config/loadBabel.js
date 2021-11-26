/**
 * This utility function exists because we cannot use preset + plugin names, 
 * but *must* `require` them directly.
 * 
 * @see https://github.com/Domiii/dbux/issues/456
 */
module.exports = function loadBabel(name) {
  // eslint-disable-next-line import/no-dynamic-require,global-require,camelcase
  const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
  const module = requireFunc(name);
  if (module.default) {
    return module.default;
  }
  return module;
};
