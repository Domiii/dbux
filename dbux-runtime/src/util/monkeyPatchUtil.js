import NestedError from '@dbux/common/src/NestedError';
import isFunction from 'lodash/isFunction';

import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('monkeyPatchUtil');

/**
 * future-work: `WeakMap` won't work here. Use `WeakRef` + finalizer instead
 */
const functionProxiesByOriginalFunction = new Map();
const originalFunctionsByProxy = new WeakMap();
const callbackProxiesByOriginal = new Map();
const originalCallbacksByProxy = new WeakMap();

function makeProxy(cb) {
  // TODO: add missing data nodes
  return new Proxy(cb, {
    apply(target, thisArg, args) {
      return Reflect.apply(target, thisArg, args);
    },
    construct(target, args, newTarget) {
      return Reflect.construct(target, args, newTarget);
    },
    defineProperty(target, prop, attributes) {
      return Reflect.defineProperty(target, prop, attributes);
    },
    deleteProperty(target, prop, attributes) {
      return Reflect.deleteProperty(target, prop, attributes);
    },
    has(target, prop) {
      return Reflect.has(target, prop);
    },
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value) {
      return Reflect.set(target, prop, value);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target);
    }
  });
}


// ###########################################################################
// book-keeping (other)
// ###########################################################################

export function _registerMonkeyPatchedFunction(originalFunction, patchedFunction) {
  try {
    const proxy = makeProxy(patchedFunction);
    functionProxiesByOriginalFunction.set(originalFunction, proxy);
    if (originalFunction !== patchedFunction) {
      // hackfix: we sometimes set native functions to be itself to prevent auto patching
      //    (because for some reason, native functions cannot be WeakMap keys)
      originalFunctionsByProxy.set(proxy, originalFunction);
    }
  }
  catch (err) {
    functionProxiesByOriginalFunction.delete(originalFunction); // ATOMIC constraint: undo partial result
    throw new NestedError(`could not store mapping for monkey patched function "${originalFunction}" <-> "${patchedFunction}"`, err);
  }
}

/**
 * NOTE: does not work for patched callbacks
 */
export function isMonkeyPatchedFunction(f) {
  return originalFunctionsByProxy.has(f);
}
export function hasMonkeyPatchedFunction(f) {
  return functionProxiesByOriginalFunction.has(f);
}

export function isOrHasMonkeyPatchedFunction(f) {
  return isMonkeyPatchedFunction(f) || hasMonkeyPatchedFunction(f);
}

export function getOriginalFunction(patchedFunction) {
  return originalFunctionsByProxy.get(patchedFunction);
}

// export function getUnpatchedCallbackOrPatchedFunction(fn) {
//   return originalCallbacksByPatched.get(fn) ||
//     patchedFunctionsByOriginalFunction.get(fn) || 
//     fn;
// }

export function getPatchedFunction(originalFunction) {
  return functionProxiesByOriginalFunction.get(originalFunction);
}

/**
 * @param {*} originalFunction
 * @return `originalFunction` if it has no patched function, else its patched function.
 */
export function getPatchedFunctionOrSelf(originalFunction) {
  return functionProxiesByOriginalFunction.get(originalFunction) || originalFunction;
}

export function getPatchedFunctionOrNull(originalFunction) {
  let patchedFunction;
  if (isMonkeyPatchedFunction(originalFunction)) {
    // NOTE: this is actually a patched (not original) function
    patchedFunction = originalFunction;
  }
  else {
    patchedFunction = functionProxiesByOriginalFunction.get(originalFunction);
  }
  return patchedFunction;
}


/** ###########################################################################
 * book-keeping (callbacks)
 * ##########################################################################*/

export function _registerMonkeyPatchedCallback(originalFunction, patchedFunction) {
  try {
    const proxy = makeProxy(patchedFunction);
    callbackProxiesByOriginal.set(originalFunction, proxy);
    originalCallbacksByProxy.set(proxy, originalFunction);
  }
  catch (err) {
    callbackProxiesByOriginal.delete(originalFunction); // ATOMIC constraint: undo partial result
    throw new NestedError(`could not store monkey patch function ${originalFunction}`, err);
  }
}

export function isMonkeyPatchedCallback(f) {
  return originalCallbacksByProxy.has(f);
}

export function getOriginalCallback(patchedFunction) {
  return originalCallbacksByProxy.get(patchedFunction);
}

export function getPatchedCallback(originalCallback) {
  return callbackProxiesByOriginal.get(originalCallback);
}

// export function getPatchedCallbackOrNull(originalFunction) {
//   let patchedFunction;
//   if (isMonkeyPatchedCallback(originalFunction)) {
//     // NOTE: this is actually a patched (not original) function
//     patchedFunction = originalFunction;
//   }
//   else {
//     patchedFunction = patchedCallbacksByOriginal.get(originalFunction);
//   }
//   return patchedFunction;
// }


/** ###########################################################################
 * monkey patching
 * ##########################################################################*/

export function getOrPatchFunction(originalFunction, patcher) {
  if (!isFunction(originalFunction)) {
    throw new Error(`Monkey-patching failed - argument is not a function: ${originalFunction}`);
  }
  let patchedFunction = getPatchedFunctionOrNull(originalFunction);
  if (!patchedFunction) {
    patchedFunction = monkeyPatchFunctionOverride(originalFunction, patcher);
  }
  return patchedFunction;
}


export function tryRegisterMonkeyPatchedFunction(holder, name, patchedFunction) {
  const originalFunction = holder[name];
  if (!isFunction(originalFunction)) {
    throw new Error(`Monkey-patching failed - ${holder}.${name} is not a function: ${originalFunction}`);
  }
  if (isMonkeyPatchedFunction(originalFunction) || isMonkeyPatchedCallback(originalFunction)) {
    // don't patch already patched function
    logError(`Monkey-patching failed - ${holder}.${name} is already patched:`, originalFunction);
    return;
  }
  // holder[name] = patchedFunction;  // NOTE: we do not override the actual function
  _registerMonkeyPatchedFunction(originalFunction, patchedFunction);
}

/** ###########################################################################
 * {@link monkeyPatchFunctionOverride}
 * ##########################################################################*/

export function monkeyPatchFunctionOverride(originalFunction, patcher) {
  const patchedFunction = patcher(originalFunction);
  _registerMonkeyPatchedFunction(originalFunction, patchedFunction);
  return patchedFunction;
}

/**
 * NOTE: we use this, so it won't be considered as "patchable"
 */
export function monkeyPatchFunctionOverrideDefault(fn) {
  // return monkeyPatchFunctionOverride(fn, (orig) => function patchedFunction(...args) {
  //   return orig.call(this, ...args);
  // });
  if (functionProxiesByOriginalFunction.has(fn)) {
    warn(`Tried to re-register original function: ${fn.name} (${fn})`);
  }
  else {
    _registerMonkeyPatchedFunction(fn, fn);
  }
  return fn;
}
export function monkeyPatchMethodOverrideDefault(holder, fnName) {
  try {
    return monkeyPatchFunctionOverrideDefault(holder.prototype[fnName]);
  }
  catch (err) {
    logError(new NestedError(
      `monkeyPatchMethodOverrideDefault failed for ${holder}.prototype.${fnName}`,
      err
    ));
    return null;
  }
}
export function monkeyPatchHolderOverrideDefault(holder, fnName) {
  try {
    return monkeyPatchFunctionOverrideDefault(holder[fnName]);
  }
  catch (err) {
    logError(new NestedError(
      `monkeyPatchMethodOverrideDefault failed for ${holder}.${fnName}`,
      err
    ));
    return null;
  }
}


// ###########################################################################
// patching with `holder`
// ###########################################################################

export function monkeyPatchMethod(Clazz, methodName, handler) {
  return monkeyPatchFunctionHolder(Clazz.prototype, methodName, handler);
}


export function monkeyPatchFunctionHolder(holder, name, handler) {
  const originalFunction = holder[name];
  tryRegisterMonkeyPatchedFunction(holder, name, function patchedFunction(...args) {
    // console.debug(`patchedFunction called:`, name, originalFunction);
    return handler(this, args, originalFunction, patchedFunction);
  });
}

export function monkeyPatchFunctionHolderDefault(holder, name) {
  const handler = (thisArg, args, originalFunction, patchedFunction) => {
    // const bceTrace = peekBCEMatchCallee(patchedFunction);
    return originalFunction(...args);
  };
  monkeyPatchFunctionHolder(holder, name, handler);
}

export function monkeyPatchMethodDefault(Clazz, name) {
  const handler = (thisArg, args, originalFunction, patchedFunction) => {
    // const bceTrace = peekBCEMatchCallee(patchedFunction);
    return originalFunction.call(thisArg, ...args);
  };
  monkeyPatchMethod(Clazz, name, handler);
}

export function monkeyPatchMethodRaw(Clazz, methodName, handler) {
  return monkeyPatchFunctionHolder(Clazz.prototype, methodName, handler);
}

export function monkeyPatchGlobalRaw(functionName, handler) {
  return monkeyPatchFunctionHolder(globalThis, functionName, handler);
}


// function patchBind() {
//   // TODO: hook it up to arg<->param matching.
//   // NOTE: this works -
//   // var b = Function.prototype.bind;
//   // Function.prototype.bind = function _bind(...args) {
//   //   console.log('bound call', args);
//   //   return b.apply(this, args);
//   // };
// }

// // function f(x, y) { console.log(x, y); }

// // var g = f.bind(null, 1);
// // g(2)

// export default function monkeyPatching() {
//   patchBind();

//   // TODO: a lot more patching to be done
// }