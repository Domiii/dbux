import { performance } from 'perf_hooks';
import { newLogger } from '@dbux/common/src/log/logger';

/** @typedef {import('../externals/Stopwatch').default} ExternalStopwatch */

const Verbose = false;

const { log, debug, warn, error: logError } = newLogger('Stopwatch');

export default class Stopwatch {
  /**
   * 
   * @param {ExternalStopwatch} externalStopwatch 
   */
  constructor(externalStopwatch) {
    this.externalStopwatch = externalStopwatch;
    this.isRunning = false;
    this._timeOffset = null;
    this._time = 0;
  }

  get time() {
    if (this.isRunning) {
      return this._time + (performance.now() - this._timeOffset);
    }
    else {
      return this._time;
    }
  }

  start() {
    if (!this.isRunning) {
      Verbose && debug(`Stopwatch started: time = ${this.time}`);
      this._timeOffset = performance.now();
      this.isRunning = true;
      this.externalStopwatch.start();
    }
  }

  pause() {
    if (this.isRunning) {
      this._time += performance.now() - this._timeOffset;
      this._timeOffset = null;
      this.isRunning = false;
      this.externalStopwatch.pause();
      Verbose && debug(`Stopwatch paused: time = ${this.time}`);
    }
  }

  set(time) {
    this._time = time;
    this._timeOffset = null;
    this.isRunning = false;
    this.externalStopwatch.set(time);
  }

  show() {
    this.externalStopwatch.show();
  }

  hide() {
    this.externalStopwatch.hide();
  }
}