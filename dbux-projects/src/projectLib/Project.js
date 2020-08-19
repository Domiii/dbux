import path from 'path';
import pull from 'lodash/pull';
import defaultsDeep from 'lodash/defaultsDeep';
import sh from 'shelljs';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import BugList from './BugList';
import Process from '../util/Process';

const SharedAssetFolder = '_shared_assets_';
const PatchFolderName = '_patches_';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */

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
  gitRemote;

  /**
   * A specific commit hash or tag name to refer to (if wanted)
   */
  gitCommit;

  get gitUrl() {
    return 'https://github.com/' + this.gitRemote;
  }

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

  get runStatus() {
    return this.manager.getProjectRunStatus(this);
  }

  // ###########################################################################
  // git stuff
  // ###########################################################################

  async isCorrectGitRepository() {
    if (!this.gitRemote) {
      return false;
    }

    const remote = await this.execCaptureOut(`git remote -v`);
    return remote?.includes(this.gitRemote);
  }

  async checkCorrectGitRepository() {
    if (!await this.isCorrectGitRepository()) {
      throw new Error(`Trying to execute command in wrong git repository ${await this.execCaptureOut(`git remote -v`)}`);
    }
  }

  async gitCheckoutCommit(args) {
    await this.checkCorrectGitRepository();

    await this.exec('git reset --hard ' + (args || ''));
  }

  async gitResetHard(needConfirm = false, confirmMsg = '') {
    await this.checkCorrectGitRepository();

    if (needConfirm && !confirmMsg) {
      throw new Error('calling Project.gitResetHard with `needConfirm=true` but no `confirmMsg`');
    }

    if (!await this.checkFilesChanged()) return;

    if (needConfirm && !await this.manager.externals.confirm(confirmMsg)) {
      const err = new Error('Action rejected by user');
      err.userCanceled = true;
      throw err;
    }
    await this.exec('git reset --hard');
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

  async startWatchModeIfNotRunning() {
    if (!this.backgroundProcesses?.length && this.startWatchMode) {
      await this.startWatchMode();

      if (!this.backgroundProcesses?.length) {
        this.logger.error('project.startWatchMode did not result in any new background processes');
      }
    }
  }

  /**
   * @abstract
   */
  loadBugs() {
    throw new Error(this + ' abstract method not implemented');
  }

  async selectBug(/* bug */) {
    throw new Error(this + ' abstract method not implemented');
  }

  async openInEditor() {
    await this.manager.externals.editor.openFolder(this.project.projectPath);
  }

  // ###########################################################################
  // utilities
  // ###########################################################################

  async execInTerminal(command, options) {
    let cwd = options?.cdToProjectPath === false ? '' : this.projectPath;

    let { code } = await this.manager.externals.TerminalWrapper.execInTerminal(cwd, command, {}).waitForResult();

    if (options?.failOnStatusCode === false) {
      return code;
    }
    if (code) {
      throw new Error(`Process exit code ${code}`);
    }
    return 0;
  }

  async exec(command, options, input) {
    if (options?.cdToProjectPath !== false) {
      options = defaultsDeep(options, {
        ...(options || EmptyObject),
        processOptions: {
          cwd: this.projectPath
        }
      });
    }
    
    return this.runner._exec(command, this.logger, options, input);
  }

  async execCaptureOut(command, processOptions) {
    processOptions = {
      ...(processOptions || EmptyObject),
      cwd: this.projectPath
    };
    return Process.execCaptureOut(command, { processOptions });
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
      if (!this.backgroundProcesses.length) {
        this.runner.maybeSetStatusNone(this);
      }
    });
    return process;
  }

  /**
   * 
   * @return {bool} Whether any files in this project have changed.
   * @see https://stackoverflow.com/questions/3878624/how-do-i-programmatically-determine-if-there-are-uncommitted-changes
   */
  async checkFilesChanged() {
    await this.checkCorrectGitRepository();

    // Not sure what this line does, but seems not really useful here, since these two line does the same thing.
    // await this.exec('git update-index --refresh');

    // returns status code 1, if there are any changes
    // see: https://stackoverflow.com/questions/28296130/what-does-this-git-diff-index-quiet-head-mean
    const code = await this.exec('git diff-index --quiet HEAD --', { failOnStatusCode: false });

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
    if (rmFiles?.length) {
      const absRmFiles = rmFiles.map(fName => path.join(projectPath, fName));
      const iErr = absRmFiles.findIndex(f => !f.startsWith(projectPath));
      if (iErr >= 0) {
        throw new Error('invalid entry in `rmFiles` is not in `projectPath`: ' + rmFiles[iErr]);
      }
      this.logger.warn('Removing files:', absRmFiles);
      sh.rm('-rf', absRmFiles);
    }

    await this.manager.installDependencies();

    // copy assets
    await this.installAssets();

    // install project's custom dependencies
    await this.installDependencies();

    // NOTE: disable yarn support for now
    // if (this.packageManager === 'yarn') {
    //   await this.yarnInstall();
    // }
    // else {
    await this.npmInstall();
    // }

    // call `afterInstall` hook for different projects to do their postinstall things
    await this.afterInstall();

    // after install completed: commit modifications, so we can easily apply patches etc
    await this.autoCommit();
  }

  /**
   * NOTE: this method is called by `install` by default.
   * If already cloned, this will do nothing.
   * @virtual
   */
  async installDependencies() {
    // await this.exec(`yarn add --dev source-map-loader`);
    /*
    await this.exec(`\
        yarn remove webpack webpack-dev-server babel-loader babel-core babel babel-plugin-__coverage__ \
          babel-preset-es2015 babel-preset-es2016 babel-preset-react babel-preset-stage-2 html-webpack-plugin && \
        \
        yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env \
          webpack webpack-cli webpack-dev-server nodemon html-webpack-plugin && \
        \
        yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime`
    );
    */
  }

  async afterInstall() { }

  async autoCommit() {
    await this.checkCorrectGitRepository();

    await this.exec(`git add -A && git commit -am '"dbux auto commit"'`);
  }

  async deleteProjectFolder() {
    await sh.rm('-rf', this.projectPath);
    this._installed = false;
  }

  isProjectFolderExists() {
    return sh.test('-d', path.join(this.projectPath, '.git'));
  }


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
    if (!this.isProjectFolderExists()) {
      // const curDir = sh.pwd().toString();
      // this.log(`Cloning from "${githubUrl}"\n  in "${curDir}"...`);
      // project does not exist yet
      await this.execInTerminal(`git clone "${githubUrl}" "${projectPath}"`, {
        cdToProjectPath: false
      });

      sh.cd(projectPath);

      // if given, switch to specific commit hash, branch or tag name
      // see: https://stackoverflow.com/questions/3489173/how-to-clone-git-repository-with-specific-revision-changeset
      if (this.gitCommit) {
        await this.gitCheckoutCommit(this.gitCommit);
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
    // await this.exec('npm cache verify');

    await this.execInTerminal(`npm install`);

    // hackfix: npm installs are broken somehow.
    //      see: https://npm.community/t/need-to-run-npm-install-twice/3920
    //      Sometimes running it a second time after checking out a different branch 
    //      deletes all node_modules. This will bring everything back correctly (for now).
    await this.execInTerminal(`npm install`);
  }

  // async yarnInstall() {
  //   await this.exec(`yarn install`);
  // }

  // ###########################################################################
  // assets
  // ###########################################################################

  /**
   * Copy all assets into project folder.
   */
  async installAssets() {
    // copy individual assets first
    await this.copyAssetFolder(this.folderName);

    // copy shared assets (NOTE: doesn't override individual assets)
    await this.copyAssetFolder(SharedAssetFolder);
  }

  async copyAssetFolder(assetFolderName) {
    // const assetDir = path.resolve(path.join(__dirname, `../../dbux-projects/assets/${assetFolderName}`));
    const assetDir = this.manager.externals.resources.getResourcePath('dist', 'projects', assetFolderName);

    if (await sh.test('-d', assetDir)) {
      // copy assets, if this project has any
      this.logger.log(`Copying assets from ${assetDir} to ${this.projectPath}`);
      await sh.cp('-Rn', `${assetDir}/*`, this.projectPath);
    }
  }

  // ###########################################################################
  // patches
  // ###########################################################################

  getPatchFolder() {
    return path.join(this.projectPath, PatchFolderName);
  }

  getPatchFile(patchFName) {
    if (!patchFName.endsWith('.patch')) {
      patchFName += '.patch';
    }
    return path.join(this.getPatchFolder(), patchFName);
  }

  async applyPatch(patchFName) {
    await this.checkCorrectGitRepository();

    return this.exec(`git apply --ignore-space-change --ignore-whitespace ${this.getPatchFile(patchFName)}`);
  }

  /**
   * Pipe patch content string to `git apply` via stdin.
   * 
   * @see https://git-scm.com/docs/git-apply#Documentation/git-apply.txt-ltpatchgt82308203
   */
  async applyPatchString(patchString) {
    await this.checkCorrectGitRepository();

    return this.exec(`git apply --ignore-space-change --ignore-whitespace`, null, patchString);
  }

  async extractPatch(patchFName) {
    // TODO: also copy to `AssetFolder`?
    await this.checkCorrectGitRepository();

    return this.exec(`git diff --color=never > ${this.getPatchFile(patchFName)}`);
  }

  async getPatchString() {
    await this.checkCorrectGitRepository();

    return this.execCaptureOut(`git diff --color=never`);
  }

  async getTagName() {
    await this.checkCorrectGitRepository();

    return (await this.execCaptureOut(`git describe --tags`)).trim();
  }

  // ###########################################################################
  // bugs
  // ###########################################################################

  /**
   * @return {BugList}
   */
  getOrLoadBugs() {
    if (!this._bugs) {
      const arr = this.loadBugs();
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