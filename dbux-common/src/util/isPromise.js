import isFunction from 'lodash/isFunction';

/**
 * @see https://github.com/then/is-promise/blob/master/index.js
 */
export default function isPromise(x) {
  return isFunction(x?.then);
}