import { window, StatusBarAlignment } from 'vscode';
import padStart from 'lodash/padStart';
import { performance } from 'perf_hooks';
import { registerCommand } from '../commands/commandUtil';

export default class PracticeStopwatch {
  constructor(name) {
    this.name = name;
    this._timeOffset = null;
    this._time = 0;
    this.interval = null;
    this.refreshInterval = 100;

    // statusBarItem
    this.barItem = window.createStatusBarItem(StatusBarAlignment.Right);
    this.barItem.hide();
    this.updateLabel();
  }

  get time() {
    if (this.isRunning) {
      return this._time + (performance.now() - this._timeOffset);
    }
    else {
      return this._time;
    }
  }

  get timeString() {
    const msTime = Math.floor(this.time);
    const ms = padStart(msTime % 1000, 3, '0');
    const s = padStart(Math.floor(msTime / 1000) % 60, 2, '0');
    const m = padStart(Math.floor(msTime / (60 * 1000)) % 60, 2, '0');
    const h = Math.floor(msTime / (60 * 60 * 1000));

    return `${h}:${m}:${s}.${ms}`;
  }

  get isRunning() {
    return !!this.interval;
  }

  updateLabel() {
    this.barItem.text = `$(watch) ${this.timeString}`;
  }

  start() {
    if (!this.isRunning) {
      this._timeOffset = performance.now();
      this.interval = setInterval(() => {
        this.updateLabel();
      }, this.refreshInterval);
    }
  }

  pause() {
    if (this.isRunning) {
      clearInterval(this.interval);
      this.interval = null;
      this._time += performance.now() - this._timeOffset;
      this._timeOffset = null;
    }
  }

  set(time) {
    if (this.isRunning) {
      this.pause();
    }
    this._time = time;
    this._timeOffset = null;
    this.updateLabel();
  }

  show() {
    this.barItem.show();
  }

  hide() {
    this.barItem.hide();
  }

  onClick(context, cb) {
    const commandName = `dbuxProjectView.stopWatch.${this.name}.onClick`;
    this.barItem.command = commandName;
    this.command?.dispose();
    this.command = registerCommand(context, commandName, cb);
  }
}

let stopwatch;

export function getStopwatch() {
  if (!stopwatch) {
    stopwatch = new PracticeStopwatch('practice');
  }

  return stopwatch;
}