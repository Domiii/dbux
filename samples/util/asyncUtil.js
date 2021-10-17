
/** ###########################################################################
 * util
 * ##########################################################################*/

export function sleep(ms) {
  return new Promise(r => {
    // function cb() { r(); };
    const cb = r;
    setTimeout(cb, ms)
  });
}

export function F(x) {
  return function _F() {
    console.log(x);
  };
}

function nest(x, F) {
  if (Array.isArray(x)) {
    return function nested() { return F(...x); };
  }

  return x instanceof Function ?
    x :
    function nodeRepresentation() {
      x = unwrapValue(x);
      console.log(x);
      return x;
    };
}

function unwrapValue(val) {
  if (val instanceof Function) {
    val = val();
  }
  return val;
}

function unwrapBoundValue(val, x) {
  if (Array.isArray(x)) {
    return x.map(unwrapBoundValue.bind(null, val))
  }
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
}

export async function waitTicks(n) {
  while (--n >= 0) {
    await 0;
  }
}


/** ###########################################################################
 * Promise
 * ##########################################################################*/

export function R(x) {
  return Promise.resolve(x);
}

/**
 * Promise chain
 */
export function P(previousPromise, ...xs/* , n */) {
  if (previousPromise === undefined) {
    return R();
  }
  
  let p;
  if (previousPromise instanceof Promise) {
    p = R(previousPromise);
  }
  else {
    p = R().then(nest(previousPromise, P));
    // p = R(nest(previousPromise, P)());
  }
  for (let x of xs) {
    // nested = (previousResult) => P(nested(previousResult), xs.slice(1));
    p = p.then(nest(x, P));
  }
  return p;
}

export function Pbind(val, ...xs) {
  val = unwrapValue(val);
  xs = xs.map(x => unwrapBoundValue(val, x));
  return P(...xs);
}

/** ###########################################################################
 * async
 * ##########################################################################*/


export async function A(...xs) {
  for (const x of xs) {
    await nest(x, A)();
  }
}

export function Abind(val, ...xs) {
  val = unwrapValue(val);
  xs = xs.map(x => unwrapBoundValue(val, x));
  return A(...xs);
}

export function Ar(...xs) {
  return (async function () {
    for (const x of xs.slice(0, -1)) {
      await nest(x, A)();
    }
    return unwrapValue(xs[xs.length - 1]);
  })();
}
