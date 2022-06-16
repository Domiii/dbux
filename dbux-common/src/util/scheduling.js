import { newLogger } from '../log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('throttle');

/**
 * Makes sure, function is not called more than once every `ms` milliseconds.
 * NOTE: lodash/throttle does not work with async functions.
 * @see https://github.com/Domiii/dbux/blob/master/dbux-common/src/util/scheduling.js
 * @see https://github.com/lodash/lodash/issues/4815
 */
export function throttle(cb, ms = 100) {
  let p, args;

  return (..._args) => {
    args = _args; // take the latest arguments
    if (!p) {
      p = new Promise((resolve, reject) => {
        setTimeout(async function _wrappedCb() {
          // allow throttle to be scheduled again at this point
          p = null;

          // start doing the work
          try {
            const result = await cb(...args);
            resolve(result);
          }
          catch (err) {
            logError(`Error i throttled call ${cb.name?.trim() || '(anonymous callback)'} - ${err}`);
            reject(err);
          }
          finally {
            resolve = null;
            reject = null;
          }
        }, ms);
      });
    }
    return p;
  };
}