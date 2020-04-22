import path from 'path';
import sh from 'shelljs';
import exec from '../util/exec';
import BugList from './BugList';
import { newLogger } from '../../../dbux-common/src/log/logger';


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

    this.logger = newLogger(this.debugTag);
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

  async openInEditor() {
    await this.manager.externals.editor.openFolder(this.project.projectPath);
  }

  // ###########################################################################
  // install helpers
  // ###########################################################################

  async npmInstall() {
    const { projectPath } = this;

    sh.cd(projectPath);
    await exec(`npm install`, this.logger);
  }

  async installDbuxCli() {
    const { projectPath } = this;

    sh.cd(projectPath);

    // TODO: make this work in production as well

    // await exec('pwd', this.logger);

    // const dbuxCli = path.resolve(projectPath, '../../dbux-cli');
    const dbuxCli = '../../dbux-common ../../dbux-cli';

    // TODO: select `NPM` or `yarn` based on `lock` file discovery?
    await exec(`npm install -D ${dbuxCli}`, this.logger);
  }

  // ###########################################################################
  // logging
  // ###########################################################################

  log(...args) {
    this.logger.debug(...args);
  }

  // ###########################################################################
  // misc
  // ###########################################################################

  get debugTag() {
    return `Project ${this.name}`;
  }

  toString() {
    return `[${this.debugTag}]`;
  }
}