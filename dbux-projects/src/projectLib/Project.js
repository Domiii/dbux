import fs from 'fs';
import path from 'path';
import pull from 'lodash/pull';
import defaultsDeep from 'lodash/defaultsDeep';
import sh from 'shelljs';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import BugList from './BugList';
import Process from '../util/Process';
import { checkSystemWithRequirement } from '../checkSystem';
import { MultipleFileWatcher } from '../util/multipleFileWatcher';

const SharedAssetFolder = '_shared_assets_';
const PatchFolderName = '_patches_';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */
/** @typedef {import('./Bug').default} Bug */

/**
 * Project class file.
 * @file
 */

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

  /**
   * Use github by default.
   */
  get gitUrl() {
    return 'https://github.com/' + this.gitRemote;
  }

  nodeVersion;

  get systemRequirements() {
    if (this.nodeVersion) {
      return {
        node: { version: this.nodeVersion }
      };
    }
    return null;
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

  get dependencyRoot() {
    return this.manager.config.dependencyRoot;
  }

  getNodeVersion(bug) {
    return bug.nodeVersion || this.nodeVersion || '14';
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
      throw new Error(`Trying to execute command in wrong git repository ${await this.execCaptureOut(`git remote -v`)}
This may be solved by pressing \`clean project folder\` button.`);
    }
  }

  async gitCheckoutCommit(args) {
    await this.checkCorrectGitRepository();

    await this.exec('git reset --hard ' + (args || ''));
  }

  async gitResetHardForBug(bug) {
    // TODO: make sure, user gets to save own changes first
    sh.cd(this.projectPath);
    if (bug.patch) {
      await this.gitResetHard();
    }
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
    if (this.systemRequirements) {
      // TODO:
      await checkSystemWithRequirement(this.manager, this.systemRequirements);
    }

    // git clone
    await this.gitClone();
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
  // build tools + watch mode
  // ###########################################################################

  /**
   * @param {Bug} bug 
   */
  async startWatchModeIfNotRunning(bug) {
    if (!this.backgroundProcesses?.length && this.startWatchMode) {
      let _resolve, _reject, _firstOutputPromise = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      });

      const watchFiles = bug.watchFilePaths.map(f => path.resolve(this.projectPath, f));
      const watcher = new MultipleFileWatcher(watchFiles);
      watcher.on('change', (filename, curStat, prevStat) => {
        try {
          if (curStat.birthtime.valueOf() === 0) {
            return;
          }

          watcher.close();

          _resolve();
        }
        catch (e) {
          this.logger.warn('file watcher emit event callback error:', e);
        }
      });

      const backgroundProcess = await this.startWatchMode(bug).catch(err => {
        // this.logger.error('startWatchMode failed -', err?.stack || err);
        throw new Error('startWatchMode failed -', err?.stack || err);
      });

      // if (!this.backgroundProcesses?.length) {
      //   this.logger.error('startWatchMode did not result in any new background processes');
      // }

      const outputFileString = bug.watchFilePaths
        .map(f => `"${f}"`)
        .join(', ');
      this.logger.debug(`startWatchMode waiting for output files: ${outputFileString} ...`);
      await Promise.race([
        // wait for files to be ready
        _firstOutputPromise,

        backgroundProcess.waitToEnd().then(() => {
          if (_firstOutputPromise) {
            // BackgroundProcess ended prematurely
            throw new Error('watch mode BackgroundProcess exited before files were generated');
          }
        })
      ]);
      _firstOutputPromise = null;
      this.logger.debug(`startWatchMode finished.`);
    }
  }

  getWebpackJs() {
    return this.manager.getDbuxPath('webpack/bin/webpack.js');
  }

  // ###########################################################################
  // utilities
  // ###########################################################################

  async execInTerminal(command, options) {
    let cwd = options?.cwd || this.projectPath;

    let { code } = await this.manager.externals.TerminalWrapper.execInTerminal(cwd, command, {}).waitForResult();

    if (options?.failOnStatusCode === false) {
      return code;
    }
    if (code) {
      const processExecMsg = `${cwd}$ ${command}`;
      throw new Error(`Process failed with exit code ${code} (${processExecMsg})`);
    }
    return 0;
  }

  async exec(command, options, input) {
    const cwd = options?.cwd || this.projectPath;
    options = defaultsDeep(options, {
      ...(options || EmptyObject),
      processOptions: {
        cwd
      }
    });
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
    let cwd = options?.cwd || projectPath;
    const env = {
      NODE_SKIP_PLATFORM_CHECK: 1,
      ...options?.env
    };

    // set cwd option
    options = defaultsDeep(options, {
      processOptions: {
        cwd,
        env
      }
    });

    // cd into it
    sh.cd(cwd);

    // // wait until current process finshed it's workload
    // this._process?.waitToEnd();

    const process = new Process();
    this.backgroundProcesses.push(process);
    process.
      start(cmd, this.logger, options).
      catch(err => this.logger.error(err)).
      finally(() => {
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
    // remove and copy assets
    await this.installAssets();
    await this.autoCommit();  // auto-commit -> to be on the safe side

    await this.applyBugPatchToTags();

    // install dbux dependencies
    await this.manager.installDependencies();

    // NOTE: disable yarn support for now
    // if (this.packageManager === 'yarn') {
    //   await this.yarnInstall();
    // }
    // else {
    await this.npmInstall();
    // }

    // custom dependencies
    await this.installDependencies();

    // custom `afterInstall` hook
    await this.afterInstall();

    // after install completed: commit modifications, so we can easily apply patches etc (if necessary)
    await this.autoCommit();
  }

  /**
   * NOTE: this method is called by `install` by default.
   * If already cloned, this will do nothing.
   * @virtual
   */
  async installDependencies() {
  }

  async afterInstall() { }

  async autoCommit(bug) {
    await this.checkCorrectGitRepository();

    if (await this.hasAnyChangedFiles()) {
      // only auto commit if files changed
      const files = this.getAllAssetFiles();
      this.logger.log('auto commit');

      // TODO: should not need '--allow-empty', if `hasAnyChangedFiles` is correct (TODO: test with todomvc)
      await this.exec(`git add ${files.map(name => `"${name}"`).join(' ')} && git commit -am '"[dbux auto commit]"' --allow-empty`);
      await this.gitAddOrUpdateTag(bug);
    }
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

    // TODO: read git + editor commands from config

    // clone (will do nothing if already cloned)
    if (!this.isProjectFolderExists()) {
      // const curDir = sh.pwd().toString();
      // this.log(`Cloning from "${githubUrl}"\n  in "${curDir}"...`);
      // project does not exist yet
      try {
        this.runner.createMainFolder();
        await this.execInTerminal(`git clone "${githubUrl}" "${projectPath}"`, {
          cwd: this.projectsRoot
        });
      }
      catch (err) {
        const errMsg = `Failed to clone git repository. This may be solved by pressing \`clean project folder\` button. ${err.stack}`;
        throw new Error(errMsg);
      }

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

  async applyBugPatchToTags() {
    await this.gitAddOrUpdateTag(null);
    let bugs = this.getOrLoadBugs();
    for (let bug of bugs) {
      if (bug.patch) {
        await this.applyPatch(bug.patch);
        await this.exec(`git commit -am '"[dbux auto commit] Patch ${bug.patch}"' --allow-empty`);
        await this.gitAddOrUpdateTag(bug);
        await this.revertPatch(bug.patch);
      }
    }
  }

  async switchToBugPatchTag(bug) {
    const tagName = this.getBugTagName(bug);
    return this.gitCheckout(tagName);
  }

  async npmInstall() {
    // await this.exec('npm cache verify');

    // hackfix: npm installs are broken somehow.
    //      see: https://npm.community/t/need-to-run-npm-install-twice/3920
    //      Sometimes running it a second time after checking out a different branch 
    //      deletes all node_modules. This will bring everything back correctly (for now).
    await this.execInTerminal(`npm install && npm install`);
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
    // remove unwanted files
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

    // copy assets
    const folders = this.getAllAssetFolderNames();
    folders.forEach(folderName => {
      this.copyAssetFolder(folderName);
    });

    // make sure, we have node at given version and node@lts
    if (this.nodeVersion) {
      await this.exec(`volta fetch node@${this.nodeVersion} node@lts npm@lts`);
      await this.exec(`volta pin node@${this.nodeVersion}`);
    }
  }

  getAssetDir(assetPath) {
    if (path.isAbsolute(assetPath)) {
      // absolute path
      return fs.realpathSync(assetPath);
    }
    else {
      // relative to dbux-internal asset path
      return this.manager.externals.resources.getResourcePath('dist', 'projects', assetPath);
    }
  }

  getAllAssetFolderNames() {
    const individualAssetDir = this.getAssetDir(this.folderName);
    if (sh.test('-d', individualAssetDir)) {
      return [SharedAssetFolder, this.folderName];
    }
    else {
      return [SharedAssetFolder];
    }
  }

  getAllAssetFiles() {
    const folders = this.getAllAssetFolderNames();
    const files = new Set();
    folders.forEach(folderName => {
      const assets = fs.readdirSync(this.getAssetDir(folderName));
      assets.forEach(assetName => {
        files.add(assetName);
        this.logger.debug('asset', folderName, assetName);
      });
    });

    return [...files];
  }

  async copyAssetFolder(assetFolderName) {
    // const assetDir = path.resolve(path.join(__dirname, `../../dbux-projects/assets/${assetFolderName}`));
    const assetDir = this.getAssetDir(assetFolderName);
    // copy assets, if this project has any
    this.logger.log(`Copying assets from ${assetDir} to ${this.projectPath}`);
    sh.cp('-R', `${assetDir}/*`, this.projectPath);
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

  // ###########################################################################
  // git commands
  // ###########################################################################

  /**
   * Apply (or revert) a patch file
   * @param {String} patchFName 
   * @param {Boolean} revert 
   */
  async applyPatch(patchFName, revert = false) {
    await this.checkCorrectGitRepository();

    return this.exec(`git apply ${revert ? '-R' : ''} --ignore-space-change --ignore-whitespace ${this.getPatchFile(patchFName)}`);
  }

  async revertPatch(patchFName) {
    return this.applyPatch(patchFName, true);
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

  async hasAnyChangedFiles() {
    const changes = await this.execCaptureOut(`git status -s`);
    return !!changes;
  }

  async getPatchString() {
    await this.checkCorrectGitRepository();

    return this.execCaptureOut(`git diff --color=never`);
  }

  async getTagName() {
    await this.checkCorrectGitRepository();

    return (await this.execCaptureOut(`git describe --tags`)).trim();
  }

  /**
   * Checkout to some distination
   * @param {String} checkoutTo 
   */
  async gitCheckout(checkoutTo) {
    return this.exec(`git checkout "${checkoutTo}"`);
  }

  getBugTagName(bug) {
    if (bug?.patch) {
      return `__dbux_bug_${bug.patch}`;
    }
    return '__dbux_bug_nopatch';
  }

  /**
   * Tag current commit
   * @param {String} tagName 
   */
  async gitAddOrUpdateTag(bug) {
    const tagName = this.getBugTagName(bug);
    return this.exec(`git tag -f "${tagName}"`);
  }


  // ###########################################################################
  // bugs
  // ###########################################################################

  /**
   * Get all bugs for this project
   * @return {BugList}
   */
  getOrLoadBugs() {
    if (!this._bugs) {
      let arr = this.loadBugs();
      if (process.env.NODE_ENV === 'production') {
        // NOTE: this is an immature feature
        //      for now, only provide one bug for demonstration purposes and to allow us gather feedback
        arr = arr.filter(bug => bug.label && bug.bugLocations?.length);
      }

      this._bugs = new BugList(this, arr);
    }
    return this._bugs;
  }

  getMochaCfg(bug, moreMochaArgs) {
    return {
      require: bug.require,
      keepAlive: bug.keepAlive,
      testArgs: this.getMochaRunArgs(bug, moreMochaArgs)
    };
  }

  getJestCfg(bug, moreJestArgs) {
    return {
      require: bug.require,
      // keepAlive: bug.keepAlive,
      testArgs: this.getJestRunArgs(bug, moreJestArgs)
    };
  }

  /**
   * @see https://mochajs.org/#command-line-usage
   */
  getMochaRunArgs(bug, moreArgs = EmptyArray) {
    // bugArgs
    const argArray = [
      '-c', // colors
      ...moreArgs,
      ...(bug.runArgs || EmptyArray)
    ];
    if (argArray.includes(undefined)) {
      throw new Error(bug.debugTag + ' - invalid `Project bug`. Arguments must not include `undefined`: ' + JSON.stringify(argArray));
    }
    return argArray.join(' ');      //.map(s => `"${s}"`).join(' ');
  }

  /**
   * @see https://mochajs.org/#command-line-usage
   */
  getJestRunArgs(bug, moreArgs = EmptyArray) {
    // bugArgs
    const argArray = [
      ...moreArgs,
      ...(bug.runArgs || EmptyArray)
    ];
    if (argArray.includes(undefined)) {
      throw new Error(bug.debugTag + ' - invalid `Project bug`. Arguments must not include `undefined`: ' + JSON.stringify(argArray));
    }
    return argArray.join(' ');      //.map(s => `"${s}"`).join(' ');
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