/**
 * Make sure, function is not called more than once every `ms` milliseconds.
 */
export function makeDebounce(cb, ms = 300) {
  let timer;
  function _wrapDebounce() {
    timer = null;
    cb();
  }
  return () => {
    if (!timer) {
      timer = setTimeout(_wrapDebounce, ms);
    }
  };
}