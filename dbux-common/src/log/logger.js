import NanoEvents from 'nanoevents';
import { makePrettyLog } from '../util/prettyLogs';

const errors = [];

const emitter = new NanoEvents();

/**
 * Use this as error hook
 */
export function onLogError(cb) {
  emitter.on('error', cb);
}

export class Logger {
  constructor(ns) {
    this.ns = ns;
    // this._emitter = 

    const logFunctions = {
      log: loglog,
      debug: logDebug,
      warn: logWarn,
      error: logError
    };

    for (const name in logFunctions) {
      const f = logFunctions[name];
      this[name] = (...args) => {
        f(ns, ...args);
        // this._emitter.emit(name, ...args);
      }
    }
  }
}

export function newLogger(ns) {
  return new Logger(ns);
}

export function newFileLogger(fpath) {
  const comps = fpath.split(/[/\\]/);
  let fname = comps[comps.length - 1];
  const i = fname.lastIndexOf('.');
  if (i > -1) {
    fname = fname.substring(0, i);
  }
  return new Logger(fname);
}

export function loglog(ns, ...args) {
  console.log(`[${ns}]`, ...args);
}

const prettyDebug = makePrettyLog(console.debug, 'gray');
export function logDebug(ns, ...args) {
  prettyDebug(`[${ns}]`, ...args);
}

export function logWarn(ns, ...args) {
  ns = `[${ns}]`;
  console.warn(ns, ...args);
  emitter.emit('warn', ns, ...args);
}

export function logError(ns, ...args) {
  ns = `[${ns}]`;
  console.error(ns, ...args);
  emitter.emit('error', ns, ...args);
}

export function logInternalError(...args) {
  const msgArgs = ['[DBUX INTERNAL ERROR]', ...args];
  console.error(...msgArgs);
  errors.push(msgArgs);
  emitter.emit('error', ...msgArgs);
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