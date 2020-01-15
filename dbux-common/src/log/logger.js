
const errors = [];

export class Logger {
  constructor(ns) {
    this.ns = ns;

    const logFunctions = {
      log: loglog,
      debug: logDebug,
      warn: logWarn,
      error: logError
    };

    for (const name in logFunctions) {
      const f = logFunctions[name];
      this[name] = f.bind(this, ns);
    }
  }
}

export function newLogger(ns) {
  return new Logger(ns);
}

export function loglog(ns, ...args) {
  console.log(`[${ns}]`, ...args);
}

export function logDebug(ns, ...args) {
  console.debug(`[${ns}]`, ...args);
}

export function logWarn(ns, ...args) {
  console.warn(`[${ns}]`, ...args);
}

export function logError(ns, ...args) {
  console.error(`[${ns}]`, ...args);
}

export function logInternalError(...args) {
  const err = ['[DBUX INTERNAL ERROR]', ...args];
  errors.push(err);
  console.error(...err);
}

export function getErrors() {
  return errors;
}

export function getErrorCount() {
  return errors.length;
}

export function hasErrors() {
  return !!errors.length;
}

export function getLastError() {
  return errors[errors.length-1];
}