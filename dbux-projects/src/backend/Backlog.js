import { newLogger } from '@dbux/common/src/log/logger';

/**
 * @typedef {import('../ProjectsManager').default} PracticeManager
 */

const { log, debug, warn, error: logError } = newLogger('Backlog');

const keyName = 'dbux.projects.backend.backlog';

export default class Backlog {
  /**
   * @param {PracticeManager} practiceManager 
   */
  constructor(practiceManager, doWriteFunction) {
    this.practiceManager = practiceManager;
    this.backlog = [];

    this.init();
    this._doWrite = doWriteFunction;
  }

  init() {
    this.backlog = this.practiceManager.externals.storage.get(keyName) || [];
    debug(`Backlog init: `, this.backlog);
  }

  async save() {
    return this.practiceManager.externals.storage.set(keyName, this.backlog);
  }

  size() {
    return !!this.backlog.length;
  }

  /**
   * Remember write action and try again later.
   * @param {object} writeRequest
   */
  async add(writeRequest) {
    this.backlog.push(writeRequest);
    await this.save();
  }

  /**
   * If backlog is corrupted, allow user to reset everything.
   */
  async resetBacklog() {
    this.backlog = [];
    await this.saveBacklog();
  }

  // async _doWrite(writeRequest) {
  //   
  // }

  async replay() {
    while (this.size()) {
      let writeRequest = this.backlog[0];

      try {
        await this._doWrite(writeRequest);
        this.backlog.shift();
        await this.save();
      }
      catch (err) {
        throw new Error(`Replay backlog stopped due to error: ${err.message}`);
      }
    }
  }
}