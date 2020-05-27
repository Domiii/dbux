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

  /**
   * Hold reference to webpack (watch mode), `http-serve` and other long-running background processes.
   */
  backgroundProcesses = [];

  constructor(manager) {
    this.manager = manager;

    // NOTE: we get `constructorName` from the registry
    this.name = this.folderName = this.constructor.constructorName;

    this.logger = newLogger(this.debugTag);
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  get runner() {
    return this.manager.runner;
  }

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
  // utilities
  // ###########################################################################

  exec(command, options) {
    return this.runner._exec(this, command, options);
  }

  /**
   * 
   * @return {bool} Whether any files in this project have changed.
   * @see https://stackoverflow.com/questions/3878624/how-do-i-programmatically-determine-if-there-are-uncommitted-changes
   */
  async checkFilesChanged() {
    await this.exec('git update-index --refresh', {
      failOnStatusCode: false
    });

    // returns status code 1, if there are any changes
    // see: https://stackoverflow.com/questions/28296130/what-does-this-git-diff-index-quiet-head-mean
    const code = await this.exec('git diff-index --quiet HEAD --', {
      failOnStatusCode: false
    });

    return !!code;  // code !== 0 means that there are pending changes
  }

  // ###########################################################################
  // install helpers
  // ###########################################################################

  async gitClone() {
    const {
      projectsRoot,
      projectPath,
      githubUrl
    } = this;

    // cd into project root
    sh.cd(projectsRoot);

    // TODO: read git + editor commands from config

    // clone (will do nothing if already cloned)
    if (!await sh.test('-d', projectPath)) {
      // const curDir = sh.pwd().toString();
      // this.log(`Cloning from "${githubUrl}"\n  in "${curDir}"...`);
      // project does not exist yet
      await this.exec(`git clone ${githubUrl} ${projectPath}`, {
        cdToProjectPath: false
      });
      // log('  ->', result.err || result.out);
      // (result.err && warn || log)('  ->', result.err || result.out);
      this.log(`Cloned.`);
    }
    else {
      this.log('(skipped cloning)');
    }
  }

  async npmInstall() {
    const { projectPath } = this;

    sh.cd(projectPath);
    await this.exec(`npm install`);

    // hackfix: npm installs are broken somehow.
    //      Sometimes running it a second time after checking out a different branch 
    //      deletes all node_modules. This will bring everything back correctly (for now).
    await this.exec(`npm install`);
  }

  async yarnInstall() {
    const { projectPath } = this;

    sh.cd(projectPath);
    await this.exec(`yarn install`);

  }

  async installDbuxCli() {
    const { projectPath } = this;

    sh.cd(projectPath);

    // TODO: make this work in production as well

    // await exec('pwd', this.logger);

    // const dbuxCli = path.resolve(projectPath, '../../dbux-cli');
    const dbuxCli = '../../dbux-common ../../dbux-cli';

    // TODO: select `NPM` or `yarn` based on `lock` file discovery?
    await this.exec(`npm install -D ${dbuxCli}`, this.logger);
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