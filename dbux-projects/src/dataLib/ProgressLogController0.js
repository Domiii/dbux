import { newLogger } from '@dbux/common/src/log/logger';
import ProgressLog from './ProgressLog';
import ProgressLogUtil from './progressLogUtil';

/** @typedef {import('../externals/Storage').default} ExternalStorage */

const { log, debug, warn, error: logError } = newLogger('ProgressLogController');

const storageKey = 'dbux-projects.progressLog';

export default class ProgressLogController {
  /**
   * @type {ProgressLog}
   */
  progressLog;
  
  /**
   * @type {ProgressLogUtil}
   */
  util;

  /**
   * @param {ExternalStorage} storage 
   */
  constructor(storage) {
    this.storage = storage;
    this.load();
    
    this.util = Object.fromEntries(
      Object.keys(ProgressLogUtil).map(name => [name, ProgressLogUtil[name].bind(null, this)])
    );
  }

  /**
   * Save serialized data to external storage
   */
  async save() {
    try {
      const logString = this.progressLog.serialize();
      await this.storage.set(storageKey, logString);
    }
    catch (err) {
      logError('Failed to save progress log:', err);
    }
  }

  /**
   * Load serialized data from external storage
   */
  load() {
    try {
      const logString = this.storage.get(storageKey);
      if (logString !== undefined) {
        this.progressLog = ProgressLog.fromString(logString);
      }
      else {
        // no previous log stored
        this.progressLog = new ProgressLog();
        this.save();  
      }
    }
    catch (err) {
      logError('Failed to load progress log:', err);
      this.progressLog = new ProgressLog();
      this.save();
    }
  }

  async reset() {
    this.progressLog = new ProgressLog();
    await this.save();
  }
}