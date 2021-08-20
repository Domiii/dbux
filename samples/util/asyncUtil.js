export function R(x) {
  x && console.log('[Resolve]', x);
  return Promise.resolve(x).then(() => x);
}


function thenCb(x) {
  if (Array.isArray(x)) {
    return () => P(...x);
  }

  return nested = x instanceof Function ?
    x :
    () => x;
}

/**
 * Promise chain
 */
export function P(previousPromise, ...xs/* , n */) {
  let p = previousPromise instanceof Promise ? previousPromise : R(previousPromise);
  for (let x of xs) {
    // nested = (previousResult) => P(nested(previousResult), xs.slice(1));
    p = p.then(thenCb(x));
  }
  return p;
}

export async function waitTicks(n) {
  while (--n >= 0) {
    await 0;
  }
}