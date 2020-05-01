import NanoEvents from 'nanoevents';
import { makePrettyLog } from '../util/prettyLogs';

const errors = [];

const emitter = new NanoEvents();

let floodGate = false;

function emit(...args) {
  // TODO: set/unset floodGate, if there is too much activity in too short time, so we stop sending messages in periods of high activity
  //  2 filters: (1) activity filter. When passed threshold enable floodgate. (2) during floodgate, reduce messages to 1 per n seconds, summarizing gated errors.
  /*
  dt = time passed since last emit
  gateTime = 1
  oldWeight = 0.2;
  newWeight = 1-oldWeight;
  newActivity = floodGate ? 0 : 1;
  rate = pow(gateTime * dt, 3)
  activity = (
    activity * oldWeight + 
    newActivity * newWeight
  ) * rate;
  */

  if (floodGate) {
    return;
  }

  emitter.emit(...args);
}

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
  emit('warn', ns, ...args);
}

export function logError(ns, ...args) {
  ns = `[${ns}]`;
  console.error(ns, ...args);
  emit('error', ns, ...args);
}

export function logInternalError(...args) {
  const msgArgs = ['[DBUX INTERNAL ERROR]', ...args];
  console.error(...msgArgs);
  errors.push(msgArgs);
  emit('error', ...msgArgs);
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