import NanoEvents from 'nanoevents';
import { performance } from 'perf_hooks';
import { newLogger } from '@dbux/common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('Stopwatch');

export default class Stopwatch {
  constructor() {
    this.isTiming = false;
    this._timeOffset = 0;
    this._time = 0;
    this._emitter = new NanoEvents();
  }

  start() {
    if (!this.isTiming) {
      this._timeOffset = performance.now();
      this.isTiming = true;
      this._emitter.emit('start');
      debug(`Stopwatch started: time = ${this.getTime()}`);
    }
  }

  pause() {
    if (this.isTiming) {
      this._time += performance.now() - this._timeOffset;
      this.isTiming = false;
      this._emitter.emit('pause');
      debug(`Stopwatch paused: time = ${this.getTime()}`);
    }
  }

  reset() {
    this._time = 0;
    if (this.isTiming) {
      this.isTiming = false;
      this._emitter.emit('pause');
    }
  }

  getTime() {
    if (this.isTiming) {
      return this._time + (performance.now() - this._timeOffset);
    }
    else {
      return this._time;
    }
  }

  on(eventName, cb) {
    this._emitter.on(eventName, cb);
  }
}