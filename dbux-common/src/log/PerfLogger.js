import { performance } from '../util/universalLib';
import { Logger } from './logger';

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
    super(ns, nsPerfWrapper);
  }
}

export function newPerfLogger(ns) {
  return new PerfLogger(ns && `Dbux ${ns}`);
}