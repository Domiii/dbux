import { newLogger } from '../log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('makeDebounce');

/**
 * Make sure, function is not called more than once every `ms` milliseconds.
 */
// eslint-disable-next-line camelcase
export function makeDebounce(cb, ms = 300) {
  let resolve, reject, p;
  async function _wrapDebounce() {
    const _resolve = resolve, _reject = reject;
    try {
      const result = await cb();
      _resolve(result);
    }
    catch (err) {
      logError('Error when executing callback',
        cb.name?.trim() || '(anonymous callback)', '-', err);
      _reject(err);
    }
    finally {
      p = null;
      resolve = null;
      reject = null;
    }
  }
  return () => {
    if (!p) {
      p = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      setTimeout(_wrapDebounce, ms);
    }
    return p;
  };
}