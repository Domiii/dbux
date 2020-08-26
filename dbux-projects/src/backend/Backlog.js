/**
 * @typedef {import('../ProjectsManager').default} PracticeManager
 */

const keyName = 'dbux.projects.backend.backlog';

export default class Backlog {
  /**
   * @param {PracticeManager} practiceManager 
   */
  constructor(practiceManager) {
    this.practiceManager = practiceManager;
    this.backlog = [];

    this.initBacklog();
  }

  initBacklog() {
    this.backlog = this.practiceManager.externals.storage.get(keyName) || [];
  }

  async saveBacklog() {
    return this.practiceManager.externals.storage.set(keyName, this.backlog);
  }

  hasBacklog() {
    return !!this.backlog.length;
  }

  /**
   * Remember write action and try again later.
   * @param {object} writeRequest
   */
  async addBacklog(writeRequest) {
    this.backlog.push(writeRequest);
    await this.saveBacklog();
  }

  /**
   * If backlog is corrupted, allow user to reset everything.
   */
  async resetBacklog() {
    this.backlog = [];
    await this.saveBacklog();
  }

  async _doWrite(writeRequest) {
    
  }

  async tryReplayBacklog() {
    while (this.hasBacklog()) {
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