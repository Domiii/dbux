export default class Backlog {
  hasBacklog() {
    // TODO: implement this
    return false;
  }

  /**
   * Remember write action and try again later.
   */
  async addBacklog(writeRequest) {
    // TODO: remember backlog
  }

  /**
   * If backlog is corrupted, allow user to reset everything.
   */
  async resetBacklog() {
    // TODO: reset backlog
  }

  async tryReplayBacklog() {
    // TODO

    // for (const writeRequest of ...) {
    //   try {
    //     await this._doWrite(writeRequest)
    //     // success
    //   }
    //   catch (err) {
    //     // fail: stop replaying backlog for now (will try again later)
    //     throw new Error(`Could not replay backlog: ${err.message}`);
    //   }
    // }
  }

}