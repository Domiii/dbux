import NanoEvents from 'nanoevents';
import { makePrettyLog } from '../util/prettyLogs';

const errors = [];

const emitter = new NanoEvents();

export function onLogError(cb) {
  emitter.on('error', cb);
}

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

const prettyDebug = makePrettyLog(console.debug, 'gray');
export function logDebug(ns, ...args) {
  prettyDebug(`[${ns}]`, ...args);
}

export function logWarn(ns, ...args) {
  ns = `[DBUX ${ns}]`;
  console.warn(ns, ...args);
  emitter.emit('warn', ns, ...args);
}

export function logError(ns, ...args) {
  ns = `[DBUX ${ns}]`;
  console.error(ns, ...args);
  emitter.emit('error', ns, ...args);
}

export function logInternalError(...args) {
  const err = ['[DBUX INTERNAL ERROR]', ...args];
  console.error(...err);
  errors.push(err);
  emitter.emit('error', ...err);
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
  return errors[errors.length - 1];
}