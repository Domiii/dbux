import NanoEvents from 'nanoevents';
import { makePrettyLog } from '../util/prettyLogs';

const errors = [];

const emitter = new NanoEvents();

const MinSecondsPerReport = 2;
const MinGateReportThreshold = 1;
let floodGate = false;
let floodGateReported = false;
let nGatedReports = 0;
let lastReportTime = Date.now() / 1000;
// let floodGateTimer;

function startFloodGate() {
  // floodGateTimer = 
  setTimeout(liftFloodGate, MinSecondsPerReport * 1000);
}

function liftFloodGate() {
  floodGate = false;

  if (nGatedReports >= MinGateReportThreshold) {  // only report if there is a substantial amount
    // floodGateTimer = null;
    reportUnchecked('error', `Floodgate lifted. Muted ${nGatedReports} reports in the past ${MinSecondsPerReport} seconds.`);
  }
  nGatedReports = 0;
}

function report(...args) {
  // floodgate mechanism
  if (floodGate) {
    // flood gate in effect
    ++nGatedReports;
    if (!floodGateReported) {
      floodGateReported = true;
      reportUnchecked('error', `Error reporting muted due to possibly error flood.`);
    }
    return;
  }

  // check if flood gate started
  const time = Date.now() / 1000;
  const dt = (time - lastReportTime);
  floodGate = dt < MinSecondsPerReport;

  if (floodGate) {
    startFloodGate();
  }

  reportUnchecked(...args);
}

function reportUnchecked(...args) {
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
  report('warn', ns, ...args);
}

export function logError(ns, ...args) {
  ns = `[${ns}]`;
  console.error(ns, ...args);
  report('error', ns, ...args);
}

export function logInternalError(...args) {
  const msgArgs = ['[DBUX INTERNAL ERROR]', ...args];
  console.error(...msgArgs);
  errors.push(msgArgs);
  report('error', ...msgArgs);
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