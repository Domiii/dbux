import path from 'path';
import sh from 'shelljs';
import pull from 'lodash/pull';
import defaultsDeep from 'lodash/defaultsDeep';
import { newLogger } from 'dbux-common/src/log/logger';
import BugList from './BugList';
import Process from '../util/Process';
import EmptyArray from '../../../dbux-common/src/util/EmptyArray';


export default class Project {
  /**
   * @type {BugList}
   */
  _bugs;

  /**
   * @type {ProjectsManager}
   */
  manager;

  /**
   * Hold reference to webpack (watch mode), `http-serve` and other long-running background processes.
   */
  backgroundProcesses = [];

  /**
   * Automatically assigned from the project registry.
   */
  folderName;

  // ###########################################################################
  // config
  // ###########################################################################

  /**
   * Provided for each individual project.
   */
  gitUrl;

  /**
   * A specific commit hash or tag name to refer to (if wanted)
   */
  gitCommit;

  /**
   * `npm` or `yarn`
   */
  packageManager = 'yarn';

  // ###########################################################################
  // constructor
  // ###########################################################################

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
  // project methods
  // ###########################################################################

  /**
   * @virtual
   */
  async installProject() {
    // git clone
    await this.gitClone();
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

  execBackground(cmd, options) {
    const {
      projectPath
    } = this;

    // set cwd
    let cwd;
    if (options?.cdToProjectPath !== false) {
      cwd = projectPath;

      // set cwd option
      options = defaultsDeep(options, {
        processOptions: {
          cwd
        }
      });

      // cd into it
      sh.cd(cwd);
    }

    // // wait until current process finshed it's workload
    // this._process?.waitToEnd();

    const process = new Process();
    this.backgroundProcesses.push(process);
    process.start(cmd, this.logger, options).finally(() => {
      pull(this.backgroundProcesses, process);
    });
    return process;
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

  /**
   * NOTE: This method is called by `gitClone`, only after a new clone has succeeded.
   */
  async install() {
    // remove files
    let { projectPath, rmFiles } = this;
    if (rmFiles) {
      const absRmFiles = rmFiles.map(fName => path.join(projectPath, fName));
      const iErr = absRmFiles.findIndex(f => !f.startsWith(projectPath));
      if (iErr >= 0) {
        throw new Error('invalid entry in `rmFiles` is not in `projectPath`: ' + rmFiles[iErr]);
      }
      this.logger.warn('Removing files:', absRmFiles);
      sh.rm('-rf', absRmFiles);
    }

    // copy assets
    await this.copyAssets();

    // install dbux dependencies
    // await this.installDbuxCli();

    await this.installDependencies();

    if (this.packageManager === 'yarn') {
      await this.yarnInstall();
    }
    else {
      await this.npmInstall();
    }
  }

  /**
   * NOTE: this method is called by `install` by default.
   * If already cloned, this will do nothing.
   * @virtual
   */
  async installDependencies() { }

  async gitClone() {
    const {
      projectsRoot,
      projectPath,
      gitUrl: githubUrl
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

      sh.cd(projectPath);

      // if given, switch to specific commit hash, branch or tag name
      // see: https://stackoverflow.com/questions/3489173/how-to-clone-git-repository-with-specific-revision-changeset
      if (this.gitCommit) {
        await this.exec(`git reset --hard ${this.gitCommit}`);
      }

      this.log(`Cloned. Installing...`);

      // run hook
      await this.install();

      // log('  ->', result.err || result.out);
      // (result.err && warn || log)('  ->', result.err || result.out);
      this.log(`Install finished.`);
    }
    else {
      sh.cd(projectPath);
      this.log('(skipped cloning)');
    }
  }

  async npmInstall() {
    await this.exec(`npm install`);

    // hackfix: npm installs are broken somehow.
    //      Sometimes running it a second time after checking out a different branch 
    //      deletes all node_modules. This will bring everything back correctly (for now).
    await this.exec(`npm install`);
  }

  async yarnInstall() {
    await this.exec(`yarn install`);
  }

  async installDbuxCli() {
    // TODO: make this work in production as well

    // await exec('pwd', this.logger);

    // const dbuxCli = path.resolve(projectPath, '../../dbux-cli');
    const dbuxCli = '../../dbux-common ../../dbux-cli';

    // TODO: select `npm` or `yarn` based on packageManager setting (but requires change in command)
    await this.exec(`yarn add --dev ${dbuxCli}`, this.logger);
  }

  /**
   * Copy all assets into project folder.
   */
  async copyAssets() {
    // copy individual assets first
    await this.copyAssetFolder(this.folderName);

    // copy shared assets (NOTE: doesn't override individual assets)
    await this.copyAssetFolder('_shared_assets_');
  }

  async copyAssetFolder(assetFolderName) {
    // TODO: fix these paths! (`__dirname` is overwritten by webpack and points to the `dist` dir; `__filename` points to `bundle.js`)
    const assetDir = path.resolve(path.join(__dirname, `../../dbux-projects/assets/${assetFolderName}`));

    if (await sh.test('-d', assetDir)) {
      // copy assets, if this project has any
      this.logger.log('Copying assets from', assetDir);
      await sh.cp('-Rn', `${assetDir}/*`, this.projectPath);
    }
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

  getBugArgs(bug) {
    // bugArgs
    const bugArgArray = [
      ...(bug.runArgs || EmptyArray)
    ];
    if (bugArgArray.includes(undefined)) {
      throw new Error(bug.debugTag + ' - invalid `Project bug`. Arguments must not include `undefined`: ' + JSON.stringify(bugArgArray));
    }
    return bugArgArray.join(' ');      //.map(s => `"${s}"`).join(' ');
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