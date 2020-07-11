import { window, StatusBarAlignment } from 'vscode';
import padStart from 'lodash/padStart';
import { performance } from 'perf_hooks';
import { registerCommand } from '../commands/commandUtil';

export default class PracticeStopwatch {
  constructor(name) {
    this.name = name;
    this.timeOffset = 0;
    this.time = 0;
    this.refreshInterval = 100;

    // statusBarItem
    this.barItem = window.createStatusBarItem(StatusBarAlignment.Right);
    this.barItem.hide();
    this.barItem.text = `$(watch) ${this.time}`;
  }

  get timeString() {
    const msTime = Math.floor(this.time);
    const ms = padStart(msTime % 1000, 3, '0');
    const s = padStart(Math.floor(msTime / 1000) % 60, 2, '0');
    const m = padStart(Math.floor(msTime / (60 * 1000)) % 60, 2, '0');
    const h = Math.floor(msTime / (60 * 60 * 1000));

    return `${h}:${m}:${s}.${ms}`;
  }

  start() {
    if (this.intervalId) {
      return;
    }
    let startTime = performance.now();
    this.intervalId = setInterval(() => {
      this.time = this.timeOffset + (performance.now() - startTime);
      this.barItem.text = `$(watch) ${this.timeString}`;
    }, this.refreshInterval);
    this.barItem.show();
  }

  pause() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.timeOffset = this.time;
  }

  hide() {
    this.barItem.hide();
  }

  registOnClick(context, cb) {
    const commandName = `dbuxProjectView.stopWatch.${this.name}.onClick`;
    this.barItem.command = commandName;
    this.command?.dispose();
    this.command = registerCommand(context, commandName, cb);
  }
}