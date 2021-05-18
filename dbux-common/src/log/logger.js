/* eslint no-console: 0 */
import NanoEvents from 'nanoevents';
import { performance } from '../util/universalLibs';


(function _compatabilityHackfix() {
  // NOTE: console.debug is not supported in some environments and babel, for some reason, does not polyfill it
  // eslint-disable-next-line no-console
  console.debug = console.debug || console.log;
})();

const errors = [];

const emitter = new NanoEvents();


// ###########################################################################
// reporting + flood gating
// ###########################################################################

const MinSecondsPerReport = 2;
const MinGateReportThreshold = 1;
let floodGate = false;
let floodGateReported = false;
let nGatedReports = 0;
let lastReportTime = 0;
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
  lastReportTime = time;
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

// ###########################################################################
// Logger
// ###########################################################################

function nsWrapper(logCb, ns) {
  return (...args) => {
    logCb(ns, ...args);
    // this._emitter.emit(name, ...args);
  };
}

export class Logger {
  log;
  debug;
  warn;
  error;

  constructor(ns, logWrapper = nsWrapper) {
    this.ns = ns;
    // this._emitter = 

    const logFunctions = {
      log: loglog,
      debug: logDebug,
      warn: logWarn,
      error: logError
    };
    this._addLoggers(logFunctions, logWrapper);
  }

  _addLoggers(logFunctions, logWrapper) {
    for (const name in logFunctions) {
      const f = logFunctions[name];
      // const nsArgs = (ns && [ns] || EmptyArray);
      this[name] = logWrapper(f, this.ns);
    }
  }
}

// ###########################################################################
// PerfLogger
// ###########################################################################

function makeTimestampDefault() {
  return `[${((performance.now() / 1000).toFixed(3) + '').padStart(7, 0)}]`;
}

export function nsPerfWrapper(logCb, ns, timestampCb = makeTimestampDefault) {
  return (...args) => logCb(ns, timestampCb(), ...args);
}

export class PerfLogger extends Logger {
  constructor(ns) {
    super(ns);

    const logFunctions = {
      logPerf: loglog,
      debugPerf: logDebug,
      warnPerf: logWarn,
      errorPerf: logError
    };
    this._addLoggers(logFunctions, nsPerfWrapper);
  }
}


// ###########################################################################
// log functions
// ###########################################################################

export function newLogger(ns) {
  return new Logger(ns && `Dbux ${ns}`);
}

export function newPerfLogger(ns) {
  return new PerfLogger(ns && `Dbux ${ns}`);
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

const consoleOutputStreams = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console)
};

let outputStreams = consoleOutputStreams;

function mergeOutputStreams(newStreams) {
  return Object.fromEntries(
    Object.entries(consoleOutputStreams).map(([name, cb]) => {
      return [
        name,
        (...args) => {
          cb(...args);
          newStreams[name]?.apply(newStreams, args);
        }
      ];
    })
  );
}

function wrapNs(ns) {
  return ns && `[${ns}]` || '';
}

export function loglog(ns, ...args) {
  outputStreams.log(wrapNs(ns), ...args);
}

// const prettyDebug = makePrettyLog(console.debug, 'gray');
export function logDebug(ns, ...args) {
  // color decoration
  // prettyDebug(wrapNs(ns), ...args);

  // no color
  outputStreams.debug(wrapNs(ns), ...args);
}

export function logWarn(ns, ...args) {
  ns = wrapNs(ns);
  outputStreams.warn(ns, ...args);
  // report('warn', ns, ...args);
}

export function logError(ns, ...args) {
  ns = wrapNs(ns);
  outputStreams.error(ns, ...args);
  report('error', ns, ...args);
}

// ###########################################################################
// more error handling stuff
// ###########################################################################

export function logInternalError(...args) {
  const msgArgs = ['[Dbux INTERNAL ERROR]', ...args];
  outputStreams.error(...msgArgs);
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


// ###########################################################################
// setOutputStreams
// ###########################################################################

export function setOutputStreams(newOutputStreams, fullErrorStack = true) {
  if (fullErrorStack) {
    // fix up error logging to log Error.stack
    // NOTE: by default, Error.toString returns only the message for some reason?
    const cb = newOutputStreams.error;
    newOutputStreams.error = (...args) => {
      args = args.map(arg => arg instanceof Error ? arg.stack : arg);
      cb(...args);
    };
  }
  outputStreams = mergeOutputStreams(newOutputStreams);
}