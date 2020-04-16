import path from 'path';
import sh from 'shelljs';
import BugList from './BugList';


export default class Project {
  /**
   * @type {BugList}
   */
  _bugs;

  folderName;

  constructor(manager) {
    this.manager = manager;

    // NOTE: we get `constructorName` from the registry
    this.name = this.folderName = this.constructor.constructorName;
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
  // project methods
  // ###########################################################################

  /**
   * @abstract
   */
  async installProject() {
    throw new Error(this + ' abstract method not implemented');
  }

  /**
   * @abstract
   */
  async loadBugs() {
    throw new Error(this + ' abstract method not implemented');
  }

  async selectBug(bug) {
    throw new Error(this + ' abstract method not implemented');
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