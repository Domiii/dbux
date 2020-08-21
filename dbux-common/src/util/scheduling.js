/**
 * Make sure, function is not called more than once every `ms` milliseconds.
 */
export function makeDebounce(cb, ms = 300) {
  let timer;
  function _wrapDebounce(...args) {
    timer = null;
    cb(...args);
  }
  return (...args) => {
    if (!timer) {
      timer = setTimeout(() => _wrapDebounce(...args), ms);
    }
  };
}

/**
 * Similar to `makeDebounce`, but delay the first call if another call comes in `ms` milliseconds.
 */
export function makeDelayDebounce(cb, ms = 300) {
  let timer;
  function _wrapDebounce(...args) {
    timer = null;
    cb(...args);
  }
  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => _wrapDebounce(...args), ms);
  };
}