import BugList from './BugList';

export default class Project {
  /**
   * @type {BugList}
   */
  bugs;
  _installer;

  // ###########################################################################
  // bugs
  // ###########################################################################

  /**
   * @return {BugList}
   */
  async getOrLoadBugs() {
    if (!this.bugs) {
      const arr = await this.loadBugs();
      this.bugs = new BugList(this, arr);
    }
    return this.bugs;
  }

  // ###########################################################################
  // install + load
  // ###########################################################################

  /**
   * @return {ProjectInstaller}
   */
  _getOrCreateInstaller() {
    if (!this._installer) {
      const { Installer } = this.constructor;
      if (!Installer) {
        throw new Error(`${this} class did not define "static Installer = ...;"`);
      }

      this._installer = new Installer(this);
    }
    return this._installer;
  }

  /**
   * @abstract
   */
  async install() {
    const installer = this._getOrCreateInstaller();
    return installer.install();
  }

  /**
   * @abstract
   */
  async loadBugs() {
    const installer = this._getOrCreateInstaller();
    return installer.loadBugs();
  }

  async selectBug(bug) {
    const installer = this._getOrCreateInstaller();
    return installer.selectBug(bug);
  }

  // ###########################################################################
  // misc
  // ###########################################################################

  get debugTag() {
    return `[Project ${this.name}]`;
  }

  toString() {
    return this.debugTag;
  }
}