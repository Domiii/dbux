
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
  constructor() {
    this._emitter = new NanoEvents();
  }

  // TODO: rewrite this based on `waitForAll`
  // start(fileList) {
  //   this.fileList = fileList;
  //   Verbose && debug(fileList);

  //   Verbose && debug('start', fileList.join(', '));
  //   for (let file of fileList) {
  //     fs.watchFile(file, (cur, prev) => {
  //       Verbose && debug('change', file, cur, prev);
  //       this._emitter.emit('change', file, cur, prev);
  //     });
  //   }
  // }

  async waitForAll(fileList) {
    Verbose && debug('waitForAll', fileList.join(', '));
    const observed = new Set();
    await Promise.all(fileList.map(file => {
      return new Promise((resolve) => {
        const listener = (curStat, prev) => {
          this._emitter.emit('change', file, curStat, prev, observed.size);
          if (curStat.birthtime.valueOf() === 0) {
            // NOTE: not sure why this is in here
            return;
          }
          if (!observed.has(file)) {
            observed.add(file);
            Verbose && debug('observed', observed.size, file, curStat, prev);
            fs.unwatchFile(file, listener); // stop watching anyway
            resolve();
          }
        };
        this.watchers.push([file, listener]);
        fs.watchFile(file, listener);
      });
    }));
    this.close();
  }

  on(eventName, ...args) {
    this._emitter.on(eventName, ...args);
  }

  close() {
    for (let [file, listener] of this.watchers) {
      Verbose && debug('unwatch', file);
      fs.unwatchFile(file, listener);
    }
  }
}
