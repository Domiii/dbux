import { logError } from '@dbux/common/src/log/logger';

const monkeyPatchedFunctionsByOriginalFunction = new WeakMap();
const monkeyPatchedFunctionSet = new WeakSet();


export function monkeyPatchFunctionOverride(originalFunction, patcher) {
  const patchedFunction = patcher(originalFunction);
  _registerMonkeyPatchedFunction(originalFunction, patchedFunction);
  return patchedFunction;
}

// ###########################################################################
// book-keeping
// ###########################################################################

function _registerMonkeyPatchedFunction(originalFunction, patchedFunction) {
  monkeyPatchedFunctionsByOriginalFunction.set(originalFunction, patchedFunction);
  monkeyPatchedFunctionSet.add(patchedFunction);
}

export function isMonkeyPatched(f) {
  return monkeyPatchedFunctionSet.has(f);
}

export function getPatchedFunction(originalFunction) {
  let patchedFunction;
  if (isMonkeyPatched(originalFunction)) {
    // NOTE: this is actually a patched (not original) function
    patchedFunction = originalFunction;
  }
  else {
    patchedFunction = monkeyPatchedFunctionsByOriginalFunction.get(originalFunction);
  }
  return patchedFunction;
}

export function getOrPatchFunction(originalFunction, patcher) {
  if (!(originalFunction instanceof Function)) {
    throw new Error(`Monkey-patching failed - argument is not a function: ${originalFunction}`);
  }
  let patchedFunction = getPatchedFunction(originalFunction);
  if (!patchedFunction) {
    patchedFunction = monkeyPatchFunctionOverride(originalFunction, patcher);
  }
  return patchedFunction;
}


function tryRegisterMonkeyPatchedFunction(holder, name, patchedFunction) {
  const originalFunction = holder[name];
  if (!(originalFunction instanceof Function)) {
    throw new Error(`Monkey-patching failed - ${holder}.${name} is not a function: ${originalFunction}`);
  }
  if (isMonkeyPatched(originalFunction)) {
    // don't patch already patched function
    logError(`Monkey-patching failed - ${holder}.${name} is already patched.`);
    return;
  }
  // holder[name] = patchedFunction;  // NOTE: we do not override the actual function
  _registerMonkeyPatchedFunction(originalFunction, patchedFunction);
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
    return handler(this, args, originalFunction, patchedFunction);
  });
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