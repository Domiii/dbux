import NestedError from '@dbux/common/src/NestedError';
import isFunction from 'lodash/isFunction';

import { newLogger } from '@dbux/common/src/log/logger';
import { peekBCEMatchCallee } from '../data/dataUtil';
import valueCollection from '../data/valueCollection';
import { addPurpose } from '../builtIns/builtin-util';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('monkeyPatchUtil');

/**
 * future-work: `WeakMap` won't work here. Use `WeakRef` + finalizer instead
 */
const functionProxiesByOriginalFunction = new Map();
const originalFunctionsByProxy = new WeakMap();
const callbackProxiesByOriginal = new Map();
const originalCallbacksByProxy = new WeakMap();

/**
 * hackfix: prevent circular dependency
 */
valueCollection.getOriginalFunction = getOriginalFunction;
valueCollection.getPatchedFunctionOrSelf = getPatchedFunctionOrSelf;

/** ###########################################################################
 * {@link makeProxy}
 * ##########################################################################*/

function makeProxy(originalFunction, patchedFunction) {
  // TODO: add missing data nodes
  return new Proxy(originalFunction, {
    apply(target, thisArg, args) {
      return Reflect.apply(patchedFunction, thisArg, args);
    },
    construct(target, args, newTarget) {
      // TODO: also trace construct calls (but requires removing and fully integrating the "patchedFunction" code with this)
      return Reflect.construct(patchedFunction, args, newTarget);
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


/** ###########################################################################
 * {@link registerMonkeyPatchedFunction}
 * ##########################################################################*/

export function registerMonkeyPatchedFunction(originalFunction, patchedFunction) {
  try {
    const proxy = makeProxy(originalFunction, patchedFunction);
    functionProxiesByOriginalFunction.set(originalFunction, proxy);
    // if (originalFunction !== patchedFunction) {
    // hackfix: we sometimes set native functions to be itself to prevent auto patching
    //    (because for some reason, native functions cannot be WeakMap keys)
    originalFunctionsByProxy.set(proxy, originalFunction);

    // NOTE: we add "monkey" information in `ValueCollection`
    // // hackfix: let remote know that this is monkey'ed
    // // [edit-after-send]
    // console.log('monkeyPatch', originalFunction.name, !!valueCollection._getRefByValueUnwrapped(originalFunction));
    // valueCollection._getRefByValueUnwrapped(originalFunction) &&
    //   (valueCollection._getRefByValueUnwrapped(originalFunction).monkey = true);

    // }
    return proxy;
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

export function _getPatchedFunctionOrNull(originalFunction) {
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
 * {@link registerMonkeyPatchedCallback}
 * ##########################################################################*/

export function registerMonkeyPatchedCallback(originalFunction, patchedFunction) {
  try {
    const proxy = makeProxy(originalFunction, patchedFunction);
    callbackProxiesByOriginal.set(originalFunction, proxy);
    originalCallbacksByProxy.set(proxy, originalFunction);
    return proxy;
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
 * {@link tryRegisterMonkeyPatchedFunction}
 * ##########################################################################*/


export function tryRegisterMonkeyPatchedFunction(holder, name, patchedFunction) {
  const originalFunction = holder[name];
  if (!isFunction(originalFunction)) {
    throw new Error(`Monkey-patching failed - ${holder}.${name} is not a function: ${originalFunction}`);
  }
  if (isMonkeyPatchedFunction(originalFunction) || isMonkeyPatchedCallback(originalFunction)) {
    // don't patch already patched function
    throw new Error(`Monkey-patching failed - ${holder}.${name} is already patched:`, originalFunction);
  }

  /**
   * NOTE: we do not override the actual function.
   *    → Instead, we look up the function via `getPatchedFunctionOrNull`.
   */
  // holder[name] = patchedFunction;
  return registerMonkeyPatchedFunction(originalFunction, patchedFunction);
}

export function getOrPatchFunction(originalFunction, patcher) {
  if (!isFunction(originalFunction)) {
    throw new Error(`Monkey-patching failed - argument is not a function: ${originalFunction}`);
  }
  let patchedFunction = _getPatchedFunctionOrNull(originalFunction);
  if (!patchedFunction) {
    patchedFunction = monkeyPatchFunctionOverride(originalFunction, patcher);
  }
  return patchedFunction;
}

/** ###########################################################################
 * {@link monkeyPatchFunctionOverride}
 * ##########################################################################*/

export function monkeyPatchFunctionOverride(originalFunction, patcher) {
  const patchedFunction = patcher(originalFunction);
  return registerMonkeyPatchedFunction(originalFunction, patchedFunction);
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
    return null;
  }
  else {
    return registerMonkeyPatchedFunction(fn, fn);
  }
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


/** ########################################
 * {@link monkeyPatchFunctionHolder}
 * #######################################*/


export function monkeyPatchFunctionHolder(holder, name, handler) {
  const originalFunction = holder[name];
  const proxy = tryRegisterMonkeyPatchedFunction(holder, name, function patchedFunction(...args) {
    // console.debug(`patchedFunction called:`, name, originalFunction);
    return handler(this, args, originalFunction, proxy);
  });
  return proxy;
}

export function monkeyPatchFunctionHolderPurpose(holder, name, purpose) {
  return monkeyPatchFunctionHolder(holder, name,
    // eslint-disable-next-line no-loop-func
    (arr, args, originalFunction, patchedFunction) => {
      const bceTrace = peekBCEMatchCallee(patchedFunction);
      const result = originalFunction.apply(arr, args);
      if (bceTrace) {
        addPurpose(bceTrace, purpose);
      }
      return result;
    }
  );
}

export function monkeyPatchMethod(Clazz, methodName, handler) {
  return monkeyPatchFunctionHolder(Clazz.prototype, methodName, handler);
}

export function monkeyPatchFunctionHolderDefault(holder, name) {
  const handler = (thisArg, args, originalFunction, patchedFunction) => {
    // const bceTrace = peekBCEMatchCallee(patchedFunction);
    return originalFunction(...args);
  };
  return monkeyPatchFunctionHolder(holder, name, handler);
}

export function monkeyPatchMethodDefault(Clazz, name) {
  const handler = (thisArg, args, originalFunction, patchedFunction) => {
    // const bceTrace = peekBCEMatchCallee(patchedFunction);
    return originalFunction.call(thisArg, ...args);
  };
  return monkeyPatchMethod(Clazz, name, handler);
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