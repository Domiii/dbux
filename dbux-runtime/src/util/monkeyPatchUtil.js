

export function monkeyPatchFunction(holder, name, post, pre) {
  const f = holder[name];
  if (!(f instanceof Function)) {
    throw new Error(`Monkey-patching failed: ${holder}.${name} is not a function.`);
  }
  holder[name] = function (...args) {
    pre?.(this, args);
    const result = f.apply(this, args);
    post?.(this, args, result);
    return result;
  };
}

export function monkeyPatchMethod(Clazz, methodName, post, pre) {
  return monkeyPatchFunction(Clazz.prototype, methodName, post, pre);
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