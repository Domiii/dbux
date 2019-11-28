

export function __dbux_error(...args) {
  // const argStrings = args.map(arg => JSON.stringify(arg));
  const argStrings = args.map(arg => arg + '');
  throw new Error('[dbux Error] ' + argStrings.join(' '));
}


export function __dbux_log(...args) {
  // TODO: add advanced logging library
  console.log('[dbux] ', ...args);
}

export function __dbux_getStackframe(i = 3) {
  const stack = new Error().stack.split('\n');
  // console.log(stack);
  return stack[i];
}