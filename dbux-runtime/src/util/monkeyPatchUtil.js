import { logError } from '@dbux/common/src/log/logger';

const monkeyPatchedFunctionsByOriginalFunction = new WeakMap();
const monkeyPatchedFunctionSet = new WeakMap();

export function isMonkeyPatched(f) {
  return monkeyPatchedFunctionSet.has(f);
}

export function getOrPatchFunction(originalFunction) {
  if (!(originalFunction instanceof Function)) {
    throw new Error(`Monkey-patching failed - argument is not a function: ${originalFunction}`);
  }
  if (isMonkeyPatched(originalFunction)) {
    // don't patch already patched function
    logError(`Monkey-patching failed - function ${originalFunction.name} is already patched.`);
    return;
  }
  holder[name] = patchedFunction;
  monkeyPatchedFunctionsByOriginalFunction.set(originalFunction, patchedFunction);
  monkeyPatchedFunctionSet.add(patchedFunction);
}

function _registerMonkeyPatchedFunction(holder, name, patchedFunction) {
  const originalFunction = holder[name];
  if (!(originalFunction instanceof Function)) {
    throw new Error(`Monkey-patching failed - ${holder}.${name} is not a function: ${originalFunction}`);
  }
  if (isMonkeyPatched(originalFunction)) {
    // don't patch already patched function
    logError(`Monkey-patching failed - ${holder}.${name} is already patched.`);
    return;
  }
  holder[name] = patchedFunction;
  monkeyPatchedFunctionsByOriginalFunction.set(originalFunction, patchedFunction);
  monkeyPatchedFunctionSet.add(patchedFunction);
}

export function monkeyPatchFunction(holder, name, post, pre) {
  const originalFunction = holder[name];
  _registerMonkeyPatchedFunction(holder, name, function patchedFunction(...args) {
    pre?.(this, args, patchedFunction);
    const result = originalFunction.apply(this, args);
    post?.(this, args, result, patchedFunction);
    return result;
  });
}

export function monkeyPatchMethod(Clazz, methodName, post, pre) {
  return monkeyPatchFunction(Clazz.prototype, methodName, post, pre);
}


export function monkeyPatchFunctionRaw(holder, name, cb) {
  const originalFunction = holder[name];
  _registerMonkeyPatchedFunction(holder, name, function patchedFunction(...args) {
    return cb(this, args, originalFunction, patchedFunction);
  });
}

export function monkeyPatchMethodRaw(Clazz, methodName, cb) {
  return monkeyPatchFunctionRaw(Clazz.prototype, methodName, cb);
}

export function monkeyPatchGlobalRaw(functionName, cb) {
  return monkeyPatchFunctionRaw(globalThis, functionName, cb);
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