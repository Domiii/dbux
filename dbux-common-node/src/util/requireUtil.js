import requireDynamic, { getRequireDynamic } from '@dbux/common/src/util/requireDynamic';
import glob from 'glob';
import path from 'path';
import toString from 'serialize-javascript';

/**
 * Dynamically require all files matching a glob pattern.
 */
export function requireAllGlob(pattern, propName = 'name') {
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
 * 
 */
export function requireUncached(moduleName) {
  // eslint-disable-next-line camelcase
  const requireFunc = getRequireDynamic();
  const modulePath = requireFunc.resolve(moduleName);
  delete requireFunc.cache[modulePath];
  return requireFunc(moduleName);
}
