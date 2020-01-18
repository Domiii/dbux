/**
 * Use this to make sure, functions
 */
export function makeRescheduler(f, ms = 100) {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(f, ms);
  };
}