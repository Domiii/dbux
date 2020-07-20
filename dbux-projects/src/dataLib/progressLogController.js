import { newLogger } from 'dbux-common/src/log/logger';
import ProgressLog from './Log';
import progressLogUtil from './progressLogUtil';

/**
 * @typedef {import('../externals/Storage').default} ExternalStorage
 */

const { log, debug, warn, error: logError } = newLogger('ProgressLogController');

const storageKey = 'dbux-projects.progressLog';

class ProgressLogController {
  /**
   * @type {ProgressLog}
   */
  progressLog;

  /**
   * @param {ExternalStorage} storage 
   */
  constructor(storage) {
    this.storage = storage;
    this.load();
    
    this.util = Object.fromEntries(
      Object.keys(progressLogUtil).map(name => [name, progressLogUtil[name].bind(null, this.progressLog)])
    );
  }

  async save() {
    try {
      await this.storage.set(storageKey, this.progressLog.serialize());
      debug('Progress log saved successfully');
    }
    catch (err) {
      logError('Failed to save progress log:', err);
    }
  }

  load() {
    try {
      this.progressLog = ProgressLog.fromString(this.storage.get(storageKey));
    }
    catch (err) {
      logError('Failed to load progress log:', err);
      this.progressLog = new ProgressLog();
    }
  }

  reset() {
    // TODO
  }
}

let progressLogController;

/**
 * @param {ExternalStorage} storage an external storage
 */
export function initProgressLogController(storage) {
  progressLogController = new ProgressLogController(storage);
  
  return progressLogController;
}