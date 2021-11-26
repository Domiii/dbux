import glob from 'glob';
import path from 'path';
import toString from 'serialize-javascript';

export function requireAllByName(pattern, propName = 'name') {
  const files = glob.sync(pattern);
  return Object.fromEntries(
    files.map((file) => {
      const obj = requireDynamic(path.resolve(file)).default;
      const prop = obj?.[propName];
      if (!prop) {
        // eslint-disable-next-line max-len
        throw new Error(`File should export default something with given propName ("${propName}"; e.g. functiones or classes have a "name" prop):\n file="${file}"\n export default=${toString(obj)}`);
      }
      return [prop, obj];
    })
  );
}


let _r;
export function _getRequire() {
  // NOTE: use eval to suppress meaningless webpack warning.
  // eslint-disable-next-line no-eval
  const r = _r || (_r = eval(`
    (typeof __non_webpack_require__ !== 'undefined' && __non_webpack_require__ || require)
  `));
  return r;
}

/**
 * @see https://stackoverflow.com/questions/42797313/webpack-dynamic-module-loader-by-requir
 */
export function requireDynamic(module) {
  // eslint-disable-next-line camelcase
  const requireFunc = _getRequire();
  return requireFunc(module);
}

export function requireUncached(module) {
  // eslint-disable-next-line camelcase
  const requireFunc = _getRequire();
  delete requireFunc.cache[requireFunc.resolve(module)];
  return requireFunc(module);
}
