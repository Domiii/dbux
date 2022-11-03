let __r;
let __Module;

/**
 * Returns the `require` function on platforms where it is available.
 * 
 * @see https://stackoverflow.com/questions/42797313/webpack-dynamic-module-loader-by-requir
 */
export function getRequireDynamic() {
  // NOTE: use eval to suppress meaningless webpack warning.
  // eslint-disable-next-line no-eval
  return __r || (__r = eval(`
    ((typeof __non_webpack_require__ !== 'undefined' && __non_webpack_require__) || 
    (typeof require !== 'undefined' && require))
  `)) || null;
}

/**
 * Returns the `Module` class on platforms where it is available.
 */
export function getModule() {
  return __Module || (__Module = getRequireDynamic()('module'));
}


/**
 * Custom require function to make webpack "happy".
 */
export default function requireDynamic(name) {
  const r = getRequireDynamic();
  if (!r) {
    return null;
  }
  let m = r(name);
  const Module = getModule();
  if (m instanceof Module) {
    /**
     * Require might return a module object, rather than its exported content in an ESM context.
     * @see https://nodejs.org/api/module.html#the-module-object
     */
    m = m.default;
  }
  return m;
}
