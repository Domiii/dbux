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