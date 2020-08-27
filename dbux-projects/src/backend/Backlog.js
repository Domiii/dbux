/**
 * @typedef {import('../ProjectsManager').default} PracticeManager
 */

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
      }
      catch (err) {
        throw new Error(`Replay backlog stopped due to error: ${err.message}`);
      }
    }
  }
}