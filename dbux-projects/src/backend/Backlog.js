import { newLogger } from '@dbux/common/src/log/logger';
import { isEqual } from 'lodash';
import SafetyStorage from './SafetyStorage';

/**
 * @typedef {import('../ProjectsManager').default} PracticeManager
 */

const { log, debug, warn, error: logError } = newLogger('Backlog');

const keyName = 'dbux.projects.backend.backlog';

export default class Backlog {
  /**
   * @type {SafetyStorage}
   */
  backlog;

  /**
   * @param {PracticeManager} practiceManager 
   */
  constructor(practiceManager, doWriteFunction) {
    this.practiceManager = practiceManager;

    this.init();
    this._doWrite = doWriteFunction;
  }

  init() {
    this.backlog = new SafetyStorage(keyName);
    debug(`Backlog init: `, this.backlog.get());
  }

  size() {
    return !!this.backlog.get().length;
  }

  /**
   * Remember write action and try again later.
   * @param {object} writeRequest
   */
  async add(writeRequest) {
    await this.backlog.acquireLock();

    let backlog = this.backlog.get();
    backlog.push(writeRequest);
    await this.backlog.set(backlog);

    this.backlog.releaseLock();
  }

  /**
   * If backlog is corrupted, allow user to reset everything.
   */
  async resetBacklog() {
    await this.backlog.acquireLock();
    await this.backlog.set([]);
    this.backlog.releaseLock();
  }

  // async _doWrite(writeRequest) {
  //   
  // }

  async replay() {
    await this.backlog.acquireLock();
    let backlog = this.backlog.get();
    while (backlog.length) {
      let writeRequest = backlog[0];

      try {
        await this._doWrite(writeRequest);
        backlog.shift();
      }
      catch (err) {
        backlog.shift();
        warn(`Removed write request after error: ${err.message}\n\n${JSON.stringify(writeRequest)}`);
      }
    }

    await this.backlog.set(backlog);
    this.backlog.releaseLock();
  }

  async tryRemoveEntry(request) {
    await this.backlog.acquireLock();
    let backlog = this.backlog.get().filter((entry) => {
      return !isEqual(request, entry);
    });
    await this.backlog.set(backlog);
    this.backlog.releaseLock();
  }
}