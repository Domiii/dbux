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

/**
 * @see https://stackoverflow.com/questions/42797313/webpack-dynamic-module-loader-by-requir
 */
export function requireDynamic(module) {
  // eslint-disable-next-line camelcase
  const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
  return requireFunc(module);
}

export function requireUncached(module) {
  // eslint-disable-next-line camelcase
  const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
  delete requireFunc.cache[requireFunc.resolve(module)];
  return requireFunc(module);
}
