/**
 * @file Some non-instrumented versions of the functions that we instrument...
 * (Yes it gets a bit nightmarish, because we have to be very careful not to trap into our own instrumentations.)
 */

/**
 * hackfix: make sure, we get to use the built-in bind, even if user-code overwrites it.
 * NOTE: if user-code overwrites a function, we might patch it first, leading to inf loops.
 * 
 * future-work: what if user code overwrites bind? → Will apply etc. still work? (NOTE: dealing with user-level instrumentation is always a nightmare)
 */
export const originalBind = (() => { }).bind;
originalBind.bind = originalBind;

export const originalApply = (() => { }).apply;
originalApply.bind = originalBind;


/**
 * `doApply(f, obj, args)` is a non-trapped alternative of `f.apply(obj, args)
 */
export function doApply(f, obj, args) {
  // we use some magic to sure, we don't trap into our own instrumentations (yes: bind.bind is a thing!)
  return originalApply.bind(f)(obj, args);
}

export function doCall(f, obj, ...args) {
  return doApply(f, obj, ...args);
}
