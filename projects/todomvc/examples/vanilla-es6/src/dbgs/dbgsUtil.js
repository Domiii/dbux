

export function __dbgs_error(...args) {
  // const argStrings = args.map(arg => JSON.stringify(arg));
  const argStrings = args.map(arg => arg + '');
  throw new Error('[DBGS Error] ' + argStrings.join(' '));
}


export function __dbgs_log(...args) {
  // TODO: add advanced logging library
  console.log('[DBGS] ', ...args);
}

export function __dbgs_getStackframe(i = 3) {
  const stack = new Error().stack.split('\n');
  // console.log(stack);
  return stack[i];
}