export function R(x) {
  return Promise.resolve(x);
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

function unwrapValue(val) {
  if (val instanceof Function) {
    val = val();
  }
  return val;
}

function unwrapPromise(val) {
  // if (val instanceof Promise) {
  //   return val;
  // }
  return R(unwrapValue(val));
}

/**
 * Promise chain
 */
export function P(previousPromise, ...xs/* , n */) {
  let p;
  if (previousPromise instanceof Function) {
    p = R().then(previousPromise);
  }
  else {
    p = R(previousPromise);
  }
  for (let x of xs) {
    // nested = (previousResult) => P(nested(previousResult), xs.slice(1));
    p = p.then(nest(x, P));
  }
  return p;
}

export function Pbind(val, ...xs) {
  val = unwrapValue(val);
  xs = xs.map(x => {
    if (x instanceof Function) {
      return () => {
        const xVal = unwrapValue(x);
        if (xVal instanceof Promise) {
          return xVal;
        }
        return `${val} ${xVal}`;
      };
    }
    return `${val} ${unwrapValue(x)}`;
  });
  return P(...xs);
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
