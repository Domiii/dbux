import path from 'path';
import sh from 'shelljs';
import RunnerImpl from './RunnerImpl';
import BugList from './BugList';


export default class Project {
  /**
   * @type {BugList}
   */
  _bugs;
  _installer;

  folderName;

  constructor(manager) {
    this.manager = manager;
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  get projectsRoot() {
    return this.manager.config.projectsRoot;
  }

  get projectPath() {
    return path.join(this.projectsRoot, this.folderName);
  }

  // ###########################################################################
  // bugs
  // ###########################################################################

  /**
   * @return {BugList}
   */
  async getOrLoadBugs() {
    if (!this._bugs) {
      const arr = await this.loadBugs();
      this._bugs = new BugList(this, arr);
    }
    return this._bugs;
  }

  // ###########################################################################
  // install + load
  // ###########################################################################

  /**
   * @return {RunnerImpl}
   */
  _getOrCreateInstaller() {
    if (!this._installer) {
      const { Installer } = this.constructor;
      if (!Installer) {
        throw new Error(`${this} class did not define "static Installer = ...;"`);
      }

      // make sure, `projectsRoot` exists
      const { projectsRoot } = this;
      sh.mkdir('-p', projectsRoot);

      // create installer
      this._installer = new Installer(this);
    }
    return this._installer;
  }

  /**
   * @abstract
   */
  async installProject() {
    const installer = this._getOrCreateInstaller();
    return installer.installProject();
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