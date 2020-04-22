import isFunction from 'lodash/isFunction';

export function isPromise(x) {
  return isFunction(x?.then);
}