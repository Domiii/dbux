import NanoEvents from 'nanoevents';
import { performance } from 'perf_hooks';
import { newLogger } from '@dbux/common/src/log/logger';

const Verbose = true;

const { log, debug, warn, error: logError } = newLogger('Stopwatch');

export default class Stopwatch {
  constructor() {
    this.isTiming = false;
    this._timeOffset = null;
    this._time = 0;
    this._emitter = new NanoEvents();
  }

  get time() {
    if (this.isTiming) {
      return this._time + (performance.now() - this._timeOffset);
    }
    else {
      return this._time;
    }
  }

  start() {
    if (!this.isTiming) {
      Verbose && debug(`Stopwatch started: time = ${this.time}`);
      this._timeOffset = performance.now();
      this.isTiming = true;
      this._emitter.emit('start', this.time);
    }
  }

  pause() {
    if (this.isTiming) {
      this._time += performance.now() - this._timeOffset;
      this._timeOffset = null;
      this.isTiming = false;
      this._emitter.emit('pause', this.time);
      Verbose && debug(`Stopwatch paused: time = ${this.time}`);
    }
  }

  reset() {
    this._time = 0;
    if (this.isTiming) {
      this._timeOffset = null;
      this.isTiming = false;
      this._emitter.emit('reset', this.time);
    }
  }

  set(time) {
    this._time = time;
    this._timeOffset = null;
    this.isTiming = false;
  }

  on(eventName, cb) {
    this._emitter.on(eventName, cb);
  }
}