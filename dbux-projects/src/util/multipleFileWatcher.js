
import fs from 'fs';
import NanoEvents from 'nanoevents';

import { newLogger } from '@dbux/common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('multipleFileWatcher');

// const Verbose = true;
const Verbose = false;

export class MultipleFileWatcher {
  /**
   * @type {[fs.StatWatcher]}
   */
  watchers = [];

  /**
   * @type {[String]}
   */
  fileList = [];

  /**
   * @type {NanoEvents}
   */
  _emitter;

  /**
   * @param {[String]} fileList 
   */
  constructor(fileList) {
    this._emitter = new NanoEvents();
    this.fileList = fileList;
    Verbose && debug(fileList);

    for (let file of fileList) {
      Verbose && debug('start watch', file);
      fs.watchFile(file, (cur, prev) => {
        Verbose && debug('get event', file, cur, prev);
        this._emitter.emit('change', file, cur, prev);
      });
    }
  }

  on(eventName, ...args) {
    this._emitter.on(eventName, ...args);
  }

  close() {
    for (let file of this.fileList) {
      Verbose && debug('unwatch', file);
      fs.unwatchFile(file);
    }
  }
}
