export function R(x) {
  return Promise.resolve(x).then(() => x);
}


function nest(x, F) {
  if (Array.isArray(x)) {
    return () => F(...x);
  }

  return x instanceof Function ?
    x :
    () => {
      x && console.log('[]', x);
      return x;
    };
}

/**
 * Promise chain
 */
export function P(previousPromise, ...xs/* , n */) {
  let p = previousPromise instanceof Promise ? previousPromise : R(previousPromise);
  for (let x of xs) {
    // nested = (previousResult) => P(nested(previousResult), xs.slice(1));
    p = p.then(nest(x, P));
  }
  return p;
}

export function Pbind(val, previousPromise, ...xs) {
  previousPromise = previousPromise instanceof Promise ? previousPromise : R(`${val} ${previousPromise}`);
  xs = xs.map(x => `${val} ${x}`);
  return P(previousPromise, ...xs);
}

export async function waitTicks(n) {
  while (--n >= 0) {
    await 0;
  }
}

export function A(...xs) {
  return (async function () {
    for (const x of xs) {
      await nest(x, A)();
    }
  })();
}

export function Abind(val, ...xs) {
  xs = xs.map(x => `${val} ${x}`);
  return A(xs);
}

export function Ar(...xs) {
  return (async function () {
    for (const x of xs.slice(0, -1)) {
      await nest(x, A)();
    }
    return xs[xs.length - 1];
  })();
}