
const monkeyPatchedFunctionSet = new Set();

export function isMonkeyPatched(f) {
  return f in monkeyPatchedFunctionSet;
}

function _monkeyPatchFunction(holder, name, patchedFunction) {
  const originalFunction = holder[name];
  if (!(originalFunction instanceof Function)) {
    throw new Error(`Monkey-patching failed: ${holder}.${name} is not a function: ${originalFunction}`);
  }
  holder[name] = patchedFunction;
  monkeyPatchedFunctionSet.add(patchedFunction);
}

export function monkeyPatchFunction(holder, name, post, pre) {
  const originalFunction = holder[name];
  _monkeyPatchFunction(holder, name, function patchedFunction(...args) {
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
  _monkeyPatchFunction(holder, name, function patchedFunction(...args) {
    return cb(this, args, originalFunction, patchedFunction);
  });
}

export function monkeyPatchMethodRaw(Clazz, methodName, post, pre) {
  return monkeyPatchFunctionRaw(Clazz.prototype, methodName, post, pre);
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