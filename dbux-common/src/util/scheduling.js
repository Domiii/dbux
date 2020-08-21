import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('makeDebounce');

/**
 * Make sure, function is not called more than once every `ms` milliseconds.
 */
// eslint-disable-next-line camelcase
export function makeDebounce(cb, ms = 300) {
  let timer;
  function _wrapDebounce() {
    timer = null;
    try {
      cb();
    }
    catch (err) {
      logError('Error when executing callback', 
        cb.name?.trim() || '(anonymous callback)', '-', err);
    }
  }
  return () => {
    if (!timer) {
      timer = setTimeout(_wrapDebounce, ms);
    }
  };
}