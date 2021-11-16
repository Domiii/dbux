import path from 'path';
import fs, { existsSync, mkdirSync } from 'fs';
import pull from 'lodash/pull';
import defaultsDeep from 'lodash/defaultsDeep';
import sh from 'shelljs';
import NestedError from '@dbux/common/src/NestedError';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { getAllFilesInFolders, globRelative, rm } from '@dbux/common-node/src/util/fileUtil';
import { pathJoin, pathRelative, pathResolve, realPathSyncNormalized } from '@dbux/common-node/src/util/pathUtil';
import isObject from 'lodash/isObject';
import cloneDeep from 'lodash/cloneDeep';
import ExerciseList from './ExerciseList';
import Process from '../util/Process';
import { MultipleFileWatcher } from '../util/multipleFileWatcher';
import { buildNodeCommand } from '../util/nodeUtil';
import { checkSystemWithRequirement } from '../checkSystem';
import RunStatus, { isStatusRunningType } from './RunStatus';
import ProjectBase from './ProjectBase';
import Exercise from './Exercise';

const Verbose = false;
const SharedAssetFolder = 'sharedAssets';
const ExerciseAssetFolder = 'exerciseAssets';
const PatchFolderName = 'patches';
const GitInstalledTag = '__dbux_project_installed';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */
/** @typedef {import('./Exercise').default} Exercise */

/**
 * Project class file.
 * @file
 */

export default class Project extends ProjectBase {
  /**
   * Created by {@link #getOrLoadBugs}.
   * @type {ExerciseList}
   */
  _exercises;

  /**
   * @type {ProjectsManager}
   */
  manager;

  /**
   * @type {string}
   */
  name;

  /**
   * Hold reference to webpack (watch mode), `http-serve` and other long-running background processes.
   */
  backgroundProcesses = [];

  /**
   * Automatically assigned from the project registry.
   */
  folderName;

  /**
   * Automatically assigned if `makeBuilder` method is present.
   */
  builder;

  /**
   * @type {ExerciseConfig[]?}
   */
  exercises;

  /**
   * Use github by default.
   */
  get gitUrl() {
    let { gitRemote } = this;
    if (!gitRemote.startsWith('http')) {
      // assume github by default
      gitRemote = 'https://github.com/' + gitRemote;
      if (!gitRemote.endsWith('.git')) {
        gitRemote += '.git';
      }
    }

    return gitRemote;
  }

  /**
   * TODO: `envName` might depend on bug!
   */
  get envName() {
    return 'development';
  }

  get systemRequirements() {
    if (this.nodeVersion) {
      return {
        node: { version: this.nodeVersion }
      };
    }
    return null;
  }

  /**
   * Whether @dbux/cli is needed to instrument and inject @dbux/runtime.
   * Returns false, if build tool already took care of it.
   */
  get needsDbuxCli() {
    return !this.builder || this.builder.needsDbuxCli;
  }


  // ###########################################################################
  // constructor + init
  // ###########################################################################

  constructor(manager, name) {
    super();

    this.manager = manager;

    // NOTE: we get `constructorName` from the registry
    this.name = this.folderName = name || this.constructor.constructorName;

    this.logger = newLogger(this.debugTag);
  }

  get originalGitFolderPath() {
    return pathResolve(this.projectPath, '.git');
  }

  get hiddenGitFolderPath() {
    // return pathResolve(this.projectsRoot, this.GitFolderName);
    // -> for now, don't hide the git folder
    // TODO: hide git folder again
    return this.originalGitFolderPath;
  }

  initProject() {
    if (this._initialized) {
      return;
    }
    this._initialized = true;

    // initialize builder
    if (this.makeBuilder) {
      this.builder = this.makeBuilder();
      this.builder.initProject(this);

      if (this.builder.startWatchMode) {
        this.startWatchMode = this.builder.startWatchMode.bind(this.builder);
      }
    }
  }

  async initExercise(bug) {
    await this.decorateExerciseForRun?.(bug);
    await this.builder?.decorateExerciseForRun(bug);

    // future-work: generalize test regexes
    // let { testRe } = bug;
    // if (isArray(testRe)) {
    //   testRe = testRe.map(re => `(?:${re})`).join('|');
    // }
    // testRe = testRe.replace(/"/g, '\\"');
    // description: testRe,
    // runArgs: [
    //   '--grep',
    //   `"${testRe}"`,
    //  ...
    // ]
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  get runner() {
    return this.manager.runner;
  }

  get sharedRoot() {
    return this.dependencyRoot;
  }

  get projectsRoot() {
    return this.manager.config.projectsRoot;
  }

  get dependencyRoot() {
    return this.manager.config.dependencyRoot;
  }

  get projectPath() {
    return pathJoin(this.projectsRoot, this.folderName);
  }

  get runStatus() {
    if (this.runner.isProjectActive(this)) {
      return this.runner.status;
    }
    else {
      return RunStatus.None;
    }
  }

  get GitFolderName() {
    return `${this.name}.git`;
  }

  get gitCommand() {
    return `git --git-dir=${this.hiddenGitFolderPath}`;
  }

  getSharedDependencyPath(relativePath = '.') {
    return pathResolve(this.sharedRoot, 'node_modules', relativePath);
  }

  getNodeVersion(bug) {
    return bug.nodeVersion || this.nodeVersion || '14';
  }

  // ###########################################################################
  // git utilities
  // ###########################################################################

  async maybeHideGitFolder() {
    if (!sh.test('-d', this.hiddenGitFolderPath)) {
      try {
        sh.mv(this.originalGitFolderPath, this.hiddenGitFolderPath);
        // here we init a new .git folder, no need to use `this.gitCommand`
        await this.exec(`git init`);
      }
      catch (err) {
        this.logger.error(`Cannot hide .git folder for project ${this.name}`);
        throw new Error(err);
      }
    }
  }

  async isCorrectGitRepository() {
    if (!this.gitRemote) {
      return false;
    }

    const remote = await this.execCaptureOut(`${this.gitCommand} remote -v`);
    return remote?.includes(this.gitRemote);
  }

  async checkCorrectGitRepository() {
    if (!await this.isCorrectGitRepository()) {
      const repo = await this.execCaptureOut(`${this.gitCommand} remote -v`);
      throw new Error(`Trying to execute command in wrong git repository:\n${repo}
Sometimes a reset (by using the \`Delete project folder\` button) can help fix this.`);
    }
  }

  async _gitResetAndCheckout(args) {
    await this.checkCorrectGitRepository();

    await this.exec(`${this.gitCommand} reset --hard ${args || ''}`);
  }

  async gitResetHard() {
    await this.checkCorrectGitRepository();

    if (await this.checkFilesChanged()) {
      await this.exec(`${this.gitCommand} reset --hard`);
    }
  }

  async gitClone() {
    const {
      projectsRoot,
      projectPath,
      gitUrl: githubUrl
    } = this;

    // TODO: read git + editor commands from config

    // clone (will do nothing if already cloned)
    if (!this.doesProjectFolderExist()) {
      try {
        this.runner.createMainFolder();
        let cmd, cwd;
        const target = this.gitTargetRef;
        // if (!target) {
        /**
         * This is the fastest approach.
         * Test: time bash -cl "git clone --single-branch --depth=1 --branch=v1 git@github.com:real-world-debugging/todomvc-es6.git"
         * -> took 6s
         * @see https://stackoverflow.com/a/69798821/2228771
         */
        const branchArg = target ? ` --branch=${this.gitTargetRef}` : '';
        const moreArgs = ' --single-branch --depth=1';
        cmd = `git clone${branchArg}${moreArgs} "${githubUrl}" "${projectPath}"`;
        cwd = projectsRoot;
        // }
        // else {
        //   /**
        //    * With target branch.
        //    * Test: time bash -cl "git init && git remote add -t v1 -f origin git@github.com:real-world-debugging/todomvc-es6.git && git checkout v1"
        //    * -> took 25s
        //    * 
        //    * @see https://stackoverflow.com/a/4146786
        //    */
        //   cmd = `git init && git remote add -t ${target} -f origin ${githubUrl} && git checkout ${target}`;
        //   cwd = projectPath;
        //   sh.mkdir('-p', cwd);
        // }
        await this.execInTerminal(cmd, {
          cwd
        });
      }
      catch (err) {
        const errMsg = `Failed to clone git repository. Sometimes a reset (by using the \`Delete project folder\` button) can help fix this - ${err.stack}`;
        throw new Error(errMsg);
      }

      sh.cd(projectPath);

      await this.maybeHideGitFolder();

      await this.selectDefaultCommit();

      this.log(`Cloned.`);
    }
    else {
      sh.cd(projectPath);
      this.log('(skipped cloning)');
    }
  }

  async gitCheckout(target, targetName) {
    targetName = targetName || target;

    if ((await this.gitGetCurrentTagName()).startsWith(targetName)) {
      // do not checkout bug, if we already on the right tag
      return;
    }

    // see: https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt-emgitcheckoutem-b-Bltnewbranchgtltstartpointgt
    await this._gitCheckout(`-B ${targetName} ${target}`);
  }

  /**
   * Checkout some target
   * @param {String} checkoutArgs
   */
  async _gitCheckout(checkoutArgs) {
    await this.checkCorrectGitRepository();
    await this.execGitCaptureErr(`checkout ${checkoutArgs}`);
  }


  // ###########################################################################
  // project methods
  // ###########################################################################

  /**
   * Clone + install
   */
  async installProject() {
    // git clone
    await this.gitClone();

    // fetch all bug tags if needed
    if (this.getExerciseGitTag) {
      await this.exec(`${this.gitCommand} fetch --all --tags`);
    }

    // run hook
    await this.install();
  }

  async checkSystemRequirement() {
    await checkSystemWithRequirement(this.manager, this.systemRequirements);
  }

  /**
   * @return {exerciseConfig}
   */
  loadExercises() {
    if (!this.exercises) {
      throw new Error(`${this.debugTag} failed to provide exercises or override loadExercises`);
    }
    return cloneDeep(this.exercises);
  }

  async openInEditor() {
    await this.manager.externals.editor.openFolder(this.project.projectPath);
  }

  // ###########################################################################
  // build tools + watch mode
  // ###########################################################################

  /**
   * @param {Exercise} exercise 
   */
  async startWatchModeIfNotRunning(exercise) {
    if (!this.backgroundProcesses?.length && this.startWatchMode) {
      const outputFileString = exercise.watchFilePaths
        .map(f => `"${f}"`)
        .join(', ');
      // let _firstOutputPromise = new Promise((resolve, reject) => {
      // watch out for entry (output) files to be created
      const watchFiles = exercise.watchFilePaths.map(f => path.resolve(this.projectPath, f));
      const watcher = new MultipleFileWatcher();
      let _firstBuildPromise = watcher.waitForAll(watchFiles);
      //   watcher.on('change', (filename, curStat, prevStat) => {
      //     try {
      //       if (curStat.birthtime.valueOf() === 0) {
      //         return;
      //       }
      //       watcher.close();
      //       resolve();
      //     }
      //     catch (err) {
      //       this.logger.warn(`file watcher failed while waiting for "${outputFileString}" - ${err?.stack || err}`);
      //     }
      //   });
      // });

      // start
      const backgroundProcess = await this.startWatchMode(exercise).catch(err => {
        // this.logger.error('startWatchMode failed -', err?.stack || err);
        throw new Error(`startWatchMode failed while waiting for "${outputFileString}" - ${err?.stack || err}`);
      });

      // if (!this.backgroundProcesses?.length) {
      //   this.logger.error('startWatchMode did not result in any new background processes');
      // }

      // wait for output files, before moving on
      this.logger.debug(`startWatchMode waiting for output files: ${outputFileString} ...`);
      await Promise.race([
        // wait for files to be ready, or...
        _firstBuildPromise,

        // ... watch process to exit prematurely
        backgroundProcess.waitToEnd().then(() => {
          if (_firstBuildPromise) {
            // BackgroundProcess ended prematurely
            throw new Error('watch mode BackgroundProcess exited before files were generated');
          }
        })
      ]);
      _firstBuildPromise = null;
      this.logger.debug(`startWatchMode finished.`);
    }
  }

  getWebpackJs() {
    return this.manager.getDbuxPath('webpack/bin/webpack.js');
  }

  // ###########################################################################
  // exec
  // ###########################################################################

  execInTerminal = async (command, options) => {
    let cwd = options?.cwd || this.projectPath;

    const result = await this.manager.externals.TerminalWrapper.execInTerminal(cwd, command, {}).
      waitForResult();

    let code;
    if (Array.isArray(result)) {
      code = result[result.length - 1].code;
    }
    else {
      code = result?.code;
    }

    if (options?.failOnStatusCode === false) {
      return code;
    }
    if (code) {
      const processExecMsg = `${cwd}$ ${command}`;
      throw new Error(`Process failed with exit code ${code} (${processExecMsg})`);
    }
    return 0;
  }

  exec = async (command, options, input) => {
    const cwd = options?.cwd || this.projectPath;
    options = defaultsDeep(options, {
      ...(options || EmptyObject),
      processOptions: {
        cwd
      }
    });
    return this.runner._exec(command, this.logger, options, input);
  }

  execCaptureOut = async (command, processOptions) => {
    processOptions = {
      cwd: this.projectPath,
      ...(processOptions || EmptyObject)
    };
    return Process.execCaptureOut(command, { processOptions });
  }

  execCaptureErr = async (command, processOptions) => {
    processOptions = {
      cwd: this.projectPath,
      ...(processOptions || EmptyObject)
    };
    return Process.execCaptureErr(command, { processOptions });
  }

  /**
   * hackfix: Several git commands are FRUSTATINGLY inconsistent -
   *   1. for some reason, git checkout does not return a code, if it errors out
   *   2. info messages (not just error messages) are also sent to stderr
   *      -> so we need to use heuristics on stderr to get the actual error status
   */
  execGitCaptureErr = async (cmd, ...moreArgs) => {
    let errStringResult;
    try {
      const actualCommand = `${this.gitCommand} ${cmd}`;
      errStringResult = (await this.execCaptureErr(actualCommand, ...moreArgs)).trim();
    }
    catch (err) {
      throw new NestedError(`Git command "${cmd}" failed`, err);
    }
    if (errStringResult.startsWith('error:')) {
      throw new Error(`Git command "${cmd}" failed:\n  ${errStringResult}`);
    }
    return errStringResult;
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

  // ###########################################################################
  // more file + package utilities
  // ###########################################################################

  async installPackages(s, shared = false/* , force = true */) {
    // TODO: let user choose, or just prefer yarn by default?

    if (isObject(s)) {
      s = Object.entries(s).map(([name, version]) => `${name}@${version}`).join(' ');
    }

    // NOTE: somehow Node module resolution algorithm skips a directory, that is `projectsRoot`
    //       -> That is why we choose `dependencyRoot` instead

    const cwd = shared ? this.sharedRoot : this.projectPath;

    if (!sh.test('-f', path.join(cwd, 'package.json'))) {
      await this.exec('npm init -y', { cwd });
    }

    // TODO: make sure, `shared` does not override existing dependencies

    const cmd = this.preferredPackageManager === 'yarn' ?
      `yarn add ${shared && (process.env.NODE_ENV === 'development') ? '-W --dev' : ''}` :
      `npm install -D`;
    return this.execInTerminal(`${cmd} ${s}`, { cwd });
  }

  /**
   * NOTE: does not include new files. For that, consider `hasAnyChangedFiles()` below.
   * @return {bool} Whether any files in this project have changed.
   * @see https://stackoverflow.com/questions/3878624/how-do-i-programmatically-determine-if-there-are-uncommitted-changes
   */
  async checkFilesChanged() {
    await this.checkCorrectGitRepository();

    // Not sure what this line does, but seems not really useful here, since these two line does the same thing.
    // await this.exec('git update-index --refresh');

    // NOTE: returns status code 1, if there are any changes, IFF --exit-code or --quiet is provided
    // see: https://stackoverflow.com/questions/28296130/what-does-this-git-diff-index-quiet-head-mean
    await this.exec(`${this.gitCommand} add -A`);
    const code = await this.exec(`${this.gitCommand} diff-index --quiet HEAD --`, { failOnStatusCode: false });

    return !!code;  // code !== 0 means that there are pending changes
  }

  // async hasAnyChangedFiles() {
  //   const changes = await this.execCaptureOut(`git status -s`);
  //   return !!changes;
  // }

  // ###########################################################################
  // actual install implementation
  // ###########################################################################

  /**
   * NOTE: This method is called by `installProject`, and will be skipped if installed tag exists
   */
  async install() {
    const installedTag = this.getProjectInstalledTagName();
    if (!await this.gitDoesTagExist(installedTag)) {
      this.log(`Installing...`);

      // install dbux dependencies
      await this.manager.installDependencies();

      // copy assets
      await this.installAssets();

      // -> `beforeInstall` hook
      await this.beforeInstall?.();
      await this.builder?.beforeInstall?.();

      // install default + custom dependencies
      await this.npmInstall();
      await this.installDependencies();

      // copy assets
      await this.installAssets();

      // -> `afterInstall` hook
      await this.afterInstall();
      await this.builder?.afterInstall?.();

      // autoCommit + set tag
      await this.autoCommit(`Project installed`);
      await this.gitSetTag(installedTag);

      this.log(`Install finished.`);
    }
    else {
      this.log(`(skipped installing)`);
    }
  }

  /**
   * @deprecated We are managing bug activated state in `BugRunner.actiavtedBug` and applying patch automaticly in `ProjectManager.switchToExercise`. Commit user changes here will break the tag structure assumption.
   */
  async deactivateExercise(exercise) {
    const project = this;
    const exerciseCachedTag = project.getExerciseCachedTagTagName(exercise);

    // commit and set tag to latest commit
    await project.autoCommit(`Deactivated bug ${exercise.id}.`);
    await project.gitSetTag(exerciseCachedTag);
  }

  /**
   * @param {Exercise} exercise 
   */
  async installBug(exercise) {
    // const oldBug = this.manager.runner.bug;
    // if (oldBug && oldBug !== bug) {
    //   const oldProject = oldBug.project;
    //   await oldProject.deactivateBug(oldBug);
    // }

    const project = this;
    const installedTag = project.getProjectInstalledTagName();
    const exerciseCachedTag = project.getExerciseCachedTagTagName(exercise);

    let successfulCacheFlag = false;
    if (await project.gitDoesTagExist(exerciseCachedTag)) {
      // get back to bug's original state
      await project._gitCheckout(exerciseCachedTag);
      const currentTags = await project.gitGetAllCurrentTagName();
      if (currentTags.includes(exerciseCachedTag)) {
        // hackfix: there is some bug here where `exerciseCachedTag` appears to exist, but we never stored it, and after checkout, it ends up in `installedTag` instead
        // -> $ git tag -l *dbux*
        successfulCacheFlag = true;
      }
      else {
        throw new Error(`installBug failed - tried to checkout bug tag "${exerciseCachedTag}", but could not find tag (found: "${currentTags}"). Please re-install bug.`);
      }
    }

    if (!successfulCacheFlag) {
      // fresh start
      await project._gitCheckout(installedTag);

      // checkout bug commit, apply patch, etc.
      await project.beforeSelectBug?.(exercise);
      await project.selectExercise(exercise);
      await project.afterSelectBug?.(exercise);

      // copy assets
      await this.installAssets(exercise);

      // install default + custom dependencies
      await project.npmInstall();
      await project.installBugDependencies?.(exercise);

      // autoCommit + set tag
      await project.autoCommit(`Selected bug ${exercise.id}.`);
      await project.gitSetTag(exerciseCachedTag);
    }

    // copy assets
    await this.installAssets(exercise);
    await project.npmInstall();
    await project.autoCommit(`Installed assests.`);
  }

  /**
   * NOTE: This will only be called when the bug is run the first time.
   * @param {Exercise} bug 
   */
  async selectExercise(bug) {
    const { tag, commit } = bug;
    if (tag || commit) {
      // checkout bug tag/commit
      const target = bug.tag ? `tags/${tag}` : commit;
      const targetName = tag || commit;
      await this.gitCheckout(target, targetName);
    }
    else {
      // NOTE: selectDefaultCommit should not be necessary, since we rollback to install tag before calling this function
      // await this.selectDefaultCommit();
    }

    // apply bug patch
    if ('patch' in bug) {
      if (bug.patch) {
        // NOTE: this way we may set `bug.patch = null` to avoid applying any patch
        await this.applyPatches(bug.patch);
      }
    }
  }


  /**
   * NOTE: this method is called by `install` by default.
   * If already cloned, this will do nothing.
   * @virtual
   */
  async installDependencies() {
  }

  async afterInstall() { }

  async autoCommit(message = '') {
    await this.checkCorrectGitRepository();

    if (await this.checkFilesChanged()) {
      // only auto commit if files changed

      // add assest files to git
      // NOTE: && is not supported in all shells (e.g. Powershell)
      const files = this.getAllAssetFiles();
      // this.logger.debug(files.map(f => `${f}: ${fs.existsSync(f)}`));
      await this.exec(`${this.gitCommand} add ${files.map(name => `"${name}"`).join(' ')}`);

      message && (message = ' ' + message);

      // TODO: should not need '--allow-empty', if `checkFilesChanged` is correct (but somehow still bugs out)
      const errResult = await this.execCaptureErr(`${this.gitCommand} commit -am '"[dbux auto commit]${message}"'`);
      if (errResult.trim()) {
        this.logger.debug(`commit errResult:###\n${errResult}\n###\n`);
      }
    }
  }

  /** ###########################################################################
   * deactivate, reset, delete
   * ##########################################################################*/

  async tryDeactivate() {
    // ensure project is not running
    if (isStatusRunningType(this.runStatus)) {
      const confirmMessage = `Project ${this.name} is currently running, do you want to stop it?`;
      if (await this.manager.externals.confirm(confirmMessage)) {
        await this.runner.cancel();
      }
      else {
        return false;
      }
    }

    // ensure project is not active
    if (this.runner.isProjectActive(this)) {
      await this.runner.deactivateExercise();
    }

    return true;
  }

  async deleteProjectFolder() {
    if (!await this.tryDeactivate()) {
      return false;
    }
    if (this.doesCacheFolderExist()) {
      // also flush cache
      this.deleteCacheFolder();
    }

    rm('-rf', this.projectPath);
    rm('-rf', this.hiddenGitFolderPath);
    this._installed = false;
    return true;
  }


  /**
   * @param {Project} project 
   */
  async flushCacheConfirm() {
    // future-work: this might be the wrong cache folder, if `findCacheDir` resolves it differently
    //    -> offer an API to get (and/or flush) cache folder in babel-register (see `prepareCache`)
    const cacheRoot = this.getCacheRoot();
    const relativeProjectPath = this.getRelativeProjectPath();
    const cacheFolderStr = `${cacheRoot}/\n  ${relativeProjectPath}`;  // NOTE: path too long for modal
    if (this.doesCacheFolderExist()) {
      if (await this.manager.externals.confirm(`This will flush the cache at "${cacheFolderStr}", are you sure?`)) {
        this.deleteCacheFolder();
        await this.manager.externals.alert(`Successfully deleted cache folder for project "${this.name}"`, true);
      }
    }
    else {
      await this.manager.externals.alert(`Cache for project "${this.name}" is empty (${cacheFolderStr})`, false);
    }
  }

  getRelativeProjectPath() {
    return pathRelative(this.manager.getDefaultSourceRoot(), this.projectPath);
  }

  getCacheRoot() {
    const { envName } = this;
    return pathJoin(this.manager.getDefaultSourceRoot(), 'node_modules', '.cache', '@babel', 'register', envName);
  }

  getCacheFolder() {
    const cacheRoot = this.getCacheRoot();
    const relativeProjectPath = this.getRelativeProjectPath();

    return pathJoin(
      cacheRoot,
      relativeProjectPath
    );
  }

  doesProjectFolderExist() {
    return sh.test('-d', this.hiddenGitFolderPath);
  }

  doesCacheFolderExist() {
    const cacheFolder = this.getCacheFolder();
    return fs.existsSync(cacheFolder);
  }

  deleteCacheFolder() {
    const cacheFolder = this.getCacheFolder();
    if (fs.existsSync(cacheFolder)) {
      fs.rmSync(cacheFolder, { recursive: true });
    }
  }

  /**
   * 1. select bug tag, 2. reset hard, 3. remove bug tag
   *    -> this should be the inverse of {@link Project#installBug}
   * TODO: make sure, individual overrides of {@link Project#selectExercise} don't do anything that is not undoable (or provide some sort of `uninstallBug` function)
   */
  async resetExercise(bug) {
    const installedTag = this.getProjectInstalledTagName();
    const exerciseCachedTag = this.getExerciseCachedTagTagName(bug);

    const currentTags = await this.gitGetAllCurrentTagName();
    if (currentTags.includes(exerciseCachedTag)) {
      // if (await this.gitDoesTagExist(installedTag)) {
      // get back to project's original state
      await this._gitResetAndCheckout(installedTag);
      await this.npmInstall(); // NOTE: node_modules are not affected by git reset or checkout

      // make sure, there are no unwanted changes kicking around
      await this._gitResetAndCheckout(installedTag);
    }

    await this.gitDeleteTag(exerciseCachedTag);
  }

  /** ###########################################################################
   * unsorted
   * ##########################################################################*/

  get preferredPackageManager() {
    if (this.packageManager) {
      return this.packageManager;
    }

    // TODO: prefer yarn if yarn is installed
    if (process.env.NODE_ENV === 'development') {
      // yarn is just faster (as of April/2021)
      return 'yarn';
    }
    return 'npm';
  }

  async selectDefaultCommit() {
    // if given, switch to specific commit hash, branch or tag name
    // see: https://stackoverflow.com/questions/3489173/how-to-clone-git-repository-with-specific-revision-changeset
    if (this.gitCommit) {
      this.manager.externals.showMessage.warning(``);
      await this._gitResetAndCheckout(this.gitCommit);
    }
  }

  async npmInstall() {
    if (this.preferredPackageManager === 'yarn') {
      await this.execInTerminal('yarn install');
    }
    else {
      // await this.exec('npm cache verify');
      // hackfix: npm installs are broken somehow.
      //      see: https://npm.community/t/need-to-run-npm-install-twice/3920
      //      Sometimes running it a second time after checking out a different branch 
      //      deletes all node_modules. The second run brings everything back correctly (for now).
      await this.execInTerminal(`npm install && npm install`);
    }
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
  async installAssets(bug = null) {
    // remove unwanted files
    let { projectPath, rmFiles } = this;
    if (rmFiles?.length) {
      const absRmFiles = rmFiles.map(fName => pathResolve(projectPath, fName));
      const iErr = absRmFiles.findIndex(f => !f.startsWith(projectPath));
      if (iErr >= 0) {
        throw new Error('invalid entry in `rmFiles` is not in `projectPath`: ' + rmFiles[iErr]);
      }
      
      this.logger.warn('Removing files:', absRmFiles.join(','));
      rm('-rf', absRmFiles);
    }

    // copy assets
    const projectAssetsFolders = this.getAllAssetFolderNames();
    projectAssetsFolders.forEach(folderName => {
      this.copyAssetFolder(folderName);
    });

    // copy bug assets
    if (bug) {
      const bugAssetsFolder = this.getBugAssetFolderName(bug);
      if (bugAssetsFolder) {
        if (!existsSync(this.getAssetDir(bugAssetsFolder))) {
          this.logger.error(`Experiment "${bug.id}" should have assets, but no asset folder at "${this.getAssetDir(bugAssetsFolder)}"`);
        }
        else {
          this.copyAssetFolder(bugAssetsFolder);
        }
      }
    }

    // make sure, we have node at given version and node@lts
    if (this.nodeVersion) {
      await this.exec(`volta fetch node@${this.nodeVersion} node@lts npm@lts`);
      await this.exec(`volta pin node@${this.nodeVersion}`);
    }
  }

  getAssetDir(assetPath) {
    if (path.isAbsolute(assetPath)) {
      // absolute path
      return realPathSyncNormalized(assetPath);
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

  getBugAssetFolderName(bug) {
    if (bug.hasAssets) {
      return pathJoin(ExerciseAssetFolder, this.name, bug.name || bug.id);
    }
    else {
      return null;
    }
  }

  getAllAssetFiles() {
    return this
      .getAllAssetFolderNames()
      .map(folderName => this.getAssetDir(folderName))
      .flatMap(folder => {
        const files = globRelative(folder, '**/*');
        // hackfix: for some reason, `globRelative` sometimes picks up deleted files
        // add project dir for existsSync to work
        return files.filter(f => fs.existsSync(pathJoin(folder, f)));
      });
  }

  copyAssetFolder(assetFolderName) {
    // const assetDir = path.resolve(path.join(__dirname, `../../dbux-projects/assets/${assetFolderName}`));
    const assetDir = this.getAssetDir(assetFolderName);
    // copy assets, if this project has any
    this.log(`Copying assets from ${assetDir} to ${this.projectPath}`);

    // Globs are tricky. See: https://stackoverflow.com/a/31438355/2228771
    const copyRes = sh.cp('-rf', `${assetDir}/{.[!.],..?,}*`, this.projectPath);

    const assetFiles = getAllFilesInFolders(assetDir).join(',');
    // this.log(`Copied assets. All root files: ${await getAllFilesInFolders(this.projectPath, false).join(', ')}`);
    this.log(`Copied assets (${assetDir}): result=${copyRes.toString()}, files=${assetFiles}`,
      // this.execCaptureOut(`cat ${this.projectPath}/.babelrc.js`)
    );
  }

  // ###########################################################################
  // patches
  // ###########################################################################

  getPatchFolder() {
    return pathJoin(this.getAssetDir(PatchFolderName), this.folderName);
  }

  getPatchFile(patchFName) {
    if (!patchFName.endsWith('.patch')) {
      patchFName += '.patch';
    }
    return pathJoin(this.getPatchFolder(), patchFName);
  }

  async applyPatches(patchFNames, revert = false) {
    if (!Array.isArray(patchFNames)) {
      patchFNames = [patchFNames];
    }
    for (const fname of patchFNames) {
      await this.applyPatch(fname, revert);
    }
  }

  /**
   * Apply (or revert) a patch file.
   * See {@link #getPatchString} on how to create patches.
   * 
   * @param {String} patchFName 
   * @param {Boolean} revert 
   */
  async applyPatch(patchFName, revert = false) {
    await this.checkCorrectGitRepository();

    const patchPath = this.getPatchFile(patchFName);

    try {
      return await this.execGitCaptureErr(
        `apply ${revert ? '-R' : ''} --ignore-space-change --ignore-whitespace "${patchPath}"`
      );
    }
    catch (err) {
      // eslint-disable-next-line max-len
      throw new NestedError(`Could not apply patch "${patchFName}". Make sure it is utf8 + LF - see https://stackoverflow.com/questions/37347350/all-git-patches-i-create-throw-fatal-unrecognized-input`, err);
    }
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

    return this.exec(`${this.gitCommand} apply --ignore-space-change --ignore-whitespace`, null, patchString);
  }

  /**
   * Use this to create bug patches.
   * 
   * git diff --color=never > patchName.patch
   * git diff --color=never --ignore-cr-at-eol | unix2dos > ../../dbux-projects/assets/_patches_/X/baseline.patch
   */
  async getPatchString() {
    await this.checkCorrectGitRepository();

    return this.execCaptureOut(`${this.gitCommand} diff --color=never --ignore-cr-at-eol`);
  }

  // ###########################################################################
  // tags
  // ###########################################################################

  async getCurrentBugFromTag() {
    if (this.doesProjectFolderExist()) {
      for (const tag of (await this.gitGetAllCurrentTagName())) {
        const bug = this.parseExerciseCachedTag(tag);
        if (bug) {
          return bug;
        }
      }
    }
    return null;
  }

  async gitGetCurrentTagName() {
    await this.checkCorrectGitRepository();
    return (await this.execCaptureOut(`${this.gitCommand} describe --tags`)).trim();
  }

  async gitGetAllCurrentTagName() {
    await this.checkCorrectGitRepository();
    const tags = (await this.execCaptureOut(`git tag --points-at HEAD`)).split(/\r?\n/);
    return tags;
  }

  /**
   * Tag current commit
   * @param {String} tagName 
   */
  async gitSetTag(tagName) {
    await this.checkCorrectGitRepository();
    return this.exec(`${this.gitCommand} tag -f "${tagName}"`);
  }

  async gitDeleteTag(tagName) {
    await this.checkCorrectGitRepository();
    return this.exec(`${this.gitCommand} tag -d ${tagName}`);
  }

  async gitDoesTagExist(tag) {
    await this.checkCorrectGitRepository();
    // const code = (await this.exec(`${this.gitCommand} rev-parse "${tag}" --`, { failOnStatusCode: false }));
    // return !code;
    const result = await this.execCaptureOut(`${this.gitCommand} tag -l "${tag}" --`);
    return !!result;
  }

  getProjectInstalledTagName() {
    return GitInstalledTag;
  }

  getExerciseCachedTagTagName(bug) {
    return `__dbux_exercise_${bug.id}_selected`;
  }

  parseExerciseCachedTag(tagName) {
    const exerciseId = tagName.match(/__dbux_exercise_([^_]*)_selected/)?.[1];
    if (exerciseId) {
      return this._exercises.getById(exerciseId);
    }
    else {
      return null;
    }
  }

  // ###########################################################################
  // bugs
  // ###########################################################################

  /**
   * Get all bugs for this project
   * @return {ExerciseList}
   */
  getOrLoadExercises() {
    if (!this._exercises) {
      let exerciseConfigs = this.loadExerciseConfigs();
      const hasIds = exerciseConfigs.some(exercise => !!exercise.id);
      let lastExercise = 0;

      let exercises = exerciseConfigs.map(config => {
        // exercise.description
        let {
          description,
          testRe,
          testFilePaths
        } = config;
        config.description = description || testRe || testFilePaths?.[0] || '';

        // exercise.number
        if (!config.number) {
          // ensure cfg.number exists(type number)
          config.number = hasIds ? config.id : ++lastExercise;
        }

        // exercise.bugLocations
        if (config.bugLocations && !config.bugLocations.length) {
          // we use `!!bug.bugLocations` to determine whether this bug is "solvable"
          config.bugLocations = null;
        }

        // exercise.id
        // convert number typed id to string type(thus it's globally unique)
        config.id = `${this.name}#${config.number}`;

        return new Exercise(this, config);
      });

      if (process.env.NODE_ENV === 'production') {
        // NOTE: this is an immature feature
        //      for now, only provide one bug for demonstration purposes and to allow us gather feedback
        exercises = exercises.filter(exercise => exercise.label && exercise.isSolvable);
      }

      this._exercises = new ExerciseList(exercises);
    }
    return this._exercises;
  }

  // ###########################################################################
  // testing
  // ###########################################################################

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
    let {
      testRe,
      runArgs,
      testFilePaths
    } = bug;

    let testReArgs;
    if (testRe) {
      // fix up testRe
      if (Array.isArray(testRe)) {
        testRe = testRe.map(re => `(?:${re})`).join('|');
      }
      testRe = testRe.replace(/"/g, '\\"');
      testReArgs = testRe && ['--grep', `"${testRe}"`];
    }

    // bugArgs
    const argArray = [
      '-c', // colors
      ...moreArgs,
      ...(testReArgs || EmptyArray),
      ...(runArgs || EmptyArray),
      // '--',
      // // 'test/index.js',
      ...testFilePaths
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

  /** ###########################################################################
   * {@link runCommand}
   * ##########################################################################*/

  /**
   * Default implementation: run a node sample file.
   */
  async runCommand(bug, cfg) {
    const runCfg = {
      env: {
      }
    };

    return [
      buildNodeCommand({
        ...cfg,
        program: bug.testFilePaths[0]
      }),
      runCfg
    ];

    // // Debug shortcut:
    // // DEBUG=http node --inspect-brk --stack-trace-limit=100    --require "./test/support/env.js" "C:\\Users\\domin\\code\\dbux\\node_modules\\@dbux\\cli\\bin\\dbux.js" run  --verbose=1 --pw=superagent "c:\\Users\\domin\\code\\dbux\\dbux_projects\\express/node_modules/mocha/bin/_mocha" -- --no-exit -c -t 10000 --grep "OPTIONS should only include each method once" -- test/app.options.js

    // return buildMochaRunCommand(mochaCfg);
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

  async clearLog() {
    for (const bug of this._exercises) {
      await bug.clearLog();
    }
  }
}