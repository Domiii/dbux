import isString from 'lodash/isString';
import NanoEvents from 'nanoevents';
import { err2String } from '../util/errorLog';
import { consoleOutputStreams } from '../console';


// ###########################################################################
// reporting + flood gating
// ###########################################################################

const reportEmitter = new NanoEvents();
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
  reportEmitter.emit(...args);
}

/**
 * Use this as error hook
 */
export function onLogError(cb) {
  reportEmitter.on('error', cb);
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
      error: logError,
      trace: logTrace
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
// utility functions
// ###########################################################################

export function newLogger(ns) {
  return new Logger(ns && `Dbux ${ns}`);
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

let outputStreams = consoleOutputStreams;

function mergeOutputStreams(newStreams) {
  return Object.fromEntries(
    Object.entries(outputStreams).map(([name, cb]) => {
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

function loglog(ns, ...args) {
  outputStreams.log(wrapNs(ns), ...args);
}

// const prettyDebug = makePrettyLog(console.debug, 'gray');
function logDebug(ns, ...args) {
  // color decoration
  // prettyDebug(wrapNs(ns), ...args);

  // no color
  outputStreams.debug(wrapNs(ns), ...args);
}

function logWarn(ns, ...args) {
  ns = wrapNs(ns);
  outputStreams.warn(ns, ...args);
  // report('warn', ns, ...args);
}

export function logError(ns, ...args) {
  ns = wrapNs(ns);
  outputStreams.error(ns, ...args);
  report('error', ns, ...args);
}

function logTrace(ns, ...args) {
  ns = wrapNs(ns);
  outputStreams.trace(ns, ...args);
  report('error', ns, ...args);
}

// ###########################################################################
// setOutputStreams
// ###########################################################################

export function addOutputStreams(newOutputStreams, fullErrorStack = true) {
  if (fullErrorStack) {
    // fix up error logging to log Error.stack
    // NOTE: by default, Error.toString() returns only the message for some reason
    const cb = newOutputStreams.error;
    newOutputStreams.error = (...args) => {
      args = args.map(arg => {
        if (arg instanceof Error) {
          arg = err2String(arg);
        }
        
        if (!isString(arg)) {
          arg = arg + '';
        }

        return arg;
      });
      cb(...args);
    };
  }
  outputStreams = mergeOutputStreams(newOutputStreams);
}

// // ###########################################################################
// // log playback experiments (unused)
// // ###########################################################################

// let logRecords;
// // let logRecorder;

// export function playbackLogRecords() {
//   const entries = Object.entries(logRecords);
//   const n = entries.reduce((a, [, msgs]) => a + msgs.length, 0);
//   if (!n) {
//     // nothing to report
//     return;
//   }
  
//   for (const [type, msgs] of entries) {
//     console[type].call(console, `${msgs.length} x ${type}s:`);
//     msgs.forEach((args, i) => {
//       console[type].call(console, ` `, ...args);
//     });
//   }
// }

// function addLogRecord(type, ...args) {
//   (logRecords[type] = logRecords[type] || []).push(args);
// }

// /**
//  * Little hackfix for simplistic "log counting".
//  */
// export function enableLogRecording() {
//   logRecords = {};

//   // NOTE: for now, only count warn + error log messages
//   addOutputStreams(Object.fromEntries(
//     ['warn', 'error']
//       .map(type => {
//         return [type, addLogRecord.bind(null, type)];
//       })
//   ));
// }