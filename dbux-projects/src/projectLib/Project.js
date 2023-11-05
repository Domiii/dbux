import path from 'path';
import fs from 'fs';
import pull from 'lodash/pull';
import defaultsDeep from 'lodash/defaultsDeep';
import sh from 'shelljs';
import merge from 'lodash/merge';
import isPlainObject from 'lodash/isPlainObject';
import NestedError from '@dbux/common/src/NestedError';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { requireUncached } from '@dbux/common-node/src/util/requireUtil';
import { getAllFilesInFolders, globRelative, rm } from '@dbux/common-node/src/util/fileUtil';
import { isFileInPath, pathJoin, pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import isProductionMode from '@dbux/common-node/src/isProductionMode';
import { writeMergePackageJson } from '@dbux/cli/lib/package-util';
import ExerciseList from './ExerciseList';
import Process, { ProcessOptions } from '../util/Process';
import { MultipleFileWatcher } from '../util/multipleFileWatcher';
import { buildNodeCommand } from '../util/nodeUtil';
import { checkSystem, DefaultNodeVersion, getDefaultRequirement } from '../checkSystem';
import RunStatus, { isStatusRunningType } from './RunStatus';
import ProjectBase from './ProjectBase';
import Exercise from './Exercise';

/** @typedef {import('./ExerciseConfig').default} ExerciseConfig */

const Verbose = false;
const SharedAssetFolderName = 'sharedAssets';
const ExerciseAssetFolderName = 'exerciseAssets';
const ProjectAssetFolderName = 'projectAssets';
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
   * Created by `this.loadExercises`.
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

  runCfg;

  /**
   * Use github by default.
   */
  get gitUrl() {
    let { gitRemote } = this;
    if (!gitRemote) {
      return null;
    }
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
    // if (this.nodeVersion) {
    //   return {
    //     node: { version: this.nodeVersion }
    //   };
    // }
    return null;
  }

  /**
   * Whether @dbux/cli is needed to instrument and inject @dbux/runtime.
   * Returns false, if build tool already took care of it.
   */
  get needsDbuxCli() {
    return !this.builder || this.builder.needsDbuxCli;
  }

  /**
   * @type {ExerciseList}
   */
  get exercises() {
    if (!this._exercises) {
      this.reloadExercises();
    }
    return this._exercises;
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

    // this.reloadExercises();
  }

  get dontReset() {
    return false;
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
    if (isProductionMode() && this._initialized) {
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

  checkRunMode(config) {
    const {
      debugMode,
      dbuxEnabled,
    } = config;
    if (this.builder) {
      // we currently do not support explicit debug mode or disabling dbux with webpack
      if (debugMode) {
        throw new Error(`Debug mode is currently not supported for ${this.name}.`);
      }
      if (!dbuxEnabled) {
        throw new Error(`Dbux can currently not be disabled for ${this.name}.`);
      }
    }
    return true;
  }

  /**
   * Projects can return false to filter out incomplete exercises.
   * @virtual
   * @param {ExerciseConfig} exerciseConfig
   * @return {boolean}
   */
  canRunExercise(exerciseConfig) {
    return true;
  }

  /**
   * Decorate exercise config on loaded.
   * @virtual
   * @param {ExerciseConfig} exerciseConfig
   */
  decorateExercise(exerciseConfig) {
    // noop by default
    return exerciseConfig;
  }

  /**
   * NOTE: this is separate from `decorateExercise` because `decorateExercise` might be called before the project has been downloaded. This function however is called after download, so that all files are ready and accessible.
   * future-work: split this into `decorateOnLoad` and `decorateForRun` if needed
   * @virtual
   * @param {Exercise} exercise
   */
  async decorateExerciseForRun(exercise) {
    // noop by default
    return exercise;
  }

  async initExercise(exercise) {
    await this.decorateExerciseForRun(exercise);
    await this.builder?.decorateExerciseForRun(exercise);

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
    return `"${this.manager.paths.git}" --git-dir=${this.hiddenGitFolderPath}`;
  }

  getSharedDependencyPath(relativePath = '.') {
    return pathResolve(this.sharedRoot, 'node_modules', relativePath);
  }

  getCustomNodeVersion(exercise) {
    return exercise.nodeVersion || this.nodeVersion;
  }

  doesProjectGitFolderExist() {
    return sh.test('-d', this.hiddenGitFolderPath);
  }

  async isGitInitialized() {
    return this.doesProjectGitFolderExist();
  }

  doesProjectFolderExist() {
    return sh.test('-d', this.projectPath);
  }

  getRelativeProjectPath() {
    return pathRelative(this.manager.getDefaultSourceRoot(), this.projectPath);
  }

  /**
   * NOTE: we can only shallow clone, if we don't need to checkout non-HEAD branch/tag/commit.
   */
  canShallowClone() {
    return !this.getExerciseGitTag && !this.gitCommit;
  }

  // ###########################################################################
  // git utilities
  // ###########################################################################

  async maybeHideGitFolder() {
    if (!sh.test('-d', this.hiddenGitFolderPath)) {
      try {
        sh.mv(this.originalGitFolderPath, this.hiddenGitFolderPath);
        // here we init a new .git folder, no need to use `this.gitCommand`
        await this.exec(`"${this.manager.paths.git}" init`);
      }
      catch (err) {
        this.logger.error(`Cannot hide .git folder for project ${this.name}`);
        throw new Error(err);
      }
    }
  }

  /**
   * Will fail if project has trouble looking up remotes, or if remotes are not empty.
   */
  async assertLocalOnlyGitRepository() {
    // make sure, git command succeeds
    const errResult = (await this.execGitCaptureErr(`remote -v`)).trim();
    if (errResult) {
      throw new Error(`"git remote -v" failed - "${errResult}"`);
    }
    const result = (await this.execCaptureOut(`${this.gitCommand} remote -v`)).trim();
    if (result) {
      throw new Error(`Local-only git repository assumption failed. Git has (but should not have) a remote: ${result}`);
    }
  }

  async isCorrectGitRepository() {
    if (!this.gitRemote) {
      // we only have a local git repository
      await this.assertLocalOnlyGitRepository();
      return true;
    }

    const remote = await this.execCaptureOut(`${this.gitCommand} remote -v`);
    return remote?.includes(this.gitRemote);
  }

  async checkCorrectGitRepository() {
    if (!await this.isCorrectGitRepository()) {
      const repo = await this.execCaptureOut(`${this.gitCommand} remote -v`);
      throw new Error(`Trying to execute command in wrong git repository:\n"${repo}"
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
    if (await this.isGitInitialized()) {
      // sh.cd(projectPath);
      this.log('(skipped cloning)');
    }
    else {
      try {
        this.runner.createMainFolder();

        if (!githubUrl) {
          // project does not have a remote git repo -> create separate local repo instead
          fs.mkdirSync(projectPath, { recursive: true });
          // git init and create initial commit (which becomes HEAD)
          await this.exec(`"${this.manager.paths.git}" init`);
          await this.exec('touch .gitignore');
          await this.exec('echo "node_modules" > .gitignore');
          await this.exec(`"${this.manager.paths.git}" add .gitignore`);
          await this.execInTerminal(`"${this.manager.paths.git}" commit -a -m "initial commit"`);
        }
        else {
          // if (!target) {
          /**
           * → shallow clone only
           * This is the fastest approach.
           * Test: time bash -cl "git clone --single-branch --depth=1 --branch=v1 git@github.com:real-world-debugging/todomvc-es6.git"
           * -> took 6s
           * @see https://stackoverflow.com/a/69798821/2228771
          */
          const target = this.gitTargetRef;
          let moreArgs = '';
          if (this.canShallowClone()) {
            const branchArg = target ? ` --branch=${target}` : '';
            moreArgs = `${branchArg} --single-branch --depth=1`;
          }
          const cmd = `${this.manager.paths.git} clone${moreArgs} "${githubUrl}" "${projectPath}"`;
          const cwd = projectsRoot;
          // }
          // else {
          //   /**
          //    * With target branch.
          //    * Test: time bash -cl "git init && git remote add -t v1 -f origin git@github.com:real-world-debugging/todomvc-es6.git && git checkout v1"
          //    * -> took 25s
          //    * 
          //    * @see https://stackoverflow.com/a/4146786
          //    */
          //   cmd = `${git} init && ${git} remote add -t ${target} -f origin ${githubUrl} && ${git} checkout ${target}`;
          //   cwd = projectPath;
          //   sh.mkdir('-p', cwd);
          // }
          await this.execInTerminal(cmd, {
            cwd
          });

          // // fix up non-shallow clone → fetch all tags/commits if needed
          // if (this.getExerciseGitTag || this.gitCommit) {
          //   await this.exec(`${this.gitCommand} fetch --all --tags`);
          // }
        }
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

    // run hook
    await this.install();
  }

  async checkSystemRequirement() {
    const requirements = merge({}, getDefaultRequirement(true), this.systemRequirements);
    await checkSystem(this.manager, requirements, false);
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

      // show output channel (if there is any)
      this.manager.externals.showOutputChannel();

      // start
      const backgroundProcess = await this.startWatchMode(exercise).catch(err => {
        // this.logger.error('startWatchMode failed -', err?.stack || err);
        throw new Error(`startWatchMode failed while waiting for "${outputFileString}" - ${err?.stack || err}`);
      });

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

  #normalizeExecOptions(options) {
    const cwd = options?.cwd || this.projectPath;
    return defaultsDeep(options, {
      ...(options || EmptyObject),
      processOptions: {
        cwd
      }
    });
  }

  exec = async (command, options, input) => {
    options = this.#normalizeExecOptions(options);
    return this.runner._exec(command, this.logger, options, input);
  }

  /**
   * TODO: possibly replace all `git` calls to {@link #execCaptureOut}
   *   -> use a command similar to `execGitCaptureErr` instead, but return `out`, instead of `err`.
   */
  execCaptureOut = async (command, options) => {
    options = this.#normalizeExecOptions(options);
    return Process.execCaptureOut(command, options);
  }

  execCaptureErr = async (command, options) => {
    options = this.#normalizeExecOptions(options);
    return Process.execCaptureErr(command, options);
  }

  /**
   * 
   * @param {string} command 
   * @param {ExecOptions} options 
   */
  execCaptureAll = async (command, options) => {
    options = this.#normalizeExecOptions(options);
    return Process.execCaptureAll(command, options);
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
    if (errStringResult.startsWith('error:') || errStringResult.startsWith('fatal:')) {
      throw new Error(`Git command "${cmd}" failed:\n  ${errStringResult}`);
    }
    return errStringResult;
  }

  execBackground(cmd, options, label = cmd) {
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
      catch(err => {
        this.logger.warn(`[Background Process] "${label}" stopped.\n`, err);
      }).
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

  async ensurePackageJson() {
    const cwd = this.packageJsonFolder;
    if (!sh.test('-f', path.join(cwd, 'package.json'))) {
      const { npm } = this.manager.paths.inShell;
      await this.exec(`${npm} init -y`, { cwd });
    }
  }

  async installPackages(dependencies, shared = false/* , force = true */) {
    if (!isPlainObject(dependencies)) {
      throw new Error(`installPackages requires plain object, but received ${typeof dependencies}: ${JSON.stringify(dependencies)}`);
    }
    // dependencies = Object.entries(dependencies).map(([name, version]) => `${name}@${version}`).join(' ');
    await this.ensurePackageJson();

    /**
     * Write to `package.json` directly to circumvent weird problems with caret escaping.
     * Windows, for some reason requires quadruple escaping of carets, while mac does not.
     * future-work: add checks to `exec` command that no carets are passed in, since that would not be cross-platform.
     * 
     * @see https://github.com/yarnpkg/yarn/issues/3270
     */
    writeMergePackageJson(this.packageJsonFolder, {
      dependencies
    });

    // NOTE: somehow Node module resolution algorithm skips a directory, that is `projectsRoot`
    //       -> That is why we choose `dependencyRoot` instead

    // NOTE: we don't do shared for now.
    const cwd = shared ? this.sharedRoot : this.packageJsonFolder;
    const { npm, yarn } = this.manager.paths.inShell;
    const cmd = this.preferredPackageManager === 'yarn' ?
      `${yarn} install` :
      `${npm} install --legacy-peer-deps`;
    return this.execInTerminal(`${cmd} `, { cwd });
  }

  /**
   * NOTE: does not include new files. For that, consider `hasAnyChangedFiles()` below.
   * @return {bool} Whether any files in this project have changed.
   * @see https://stackoverflow.com/questions/3878624/how-do-i-programmatically-determine-if-there-are-uncommitted-changes
   */
  async checkFilesChanged() {
    await this.checkCorrectGitRepository();

    // Not sure what this line does, but seems not really useful here, since these two line does the same thing.
    // await this.exec('${git} update-index --refresh');

    // NOTE: returns status code 1, if there are any changes, IFF --exit-code or --quiet is provided
    // see: https://stackoverflow.com/questions/28296130/what-does-this-git-diff-index-quiet-head-mean
    await this.exec(`${this.gitCommand} add -A`);
    const code = await this.exec(`${this.gitCommand} diff-index --exit-code HEAD --`, {
      failOnStatusCode: false,
      failWhenNotFound: false // weird -> it responds with ENOENT sometimes?!
    });

    return !!code;  // code !== 0 means that there are pending changes
  }

  async gitDiff() {
    return await this.execCaptureAll(`${this.gitCommand} diff-index --exit-code HEAD --`, {
      failOnStatusCode: false,
      failWhenNotFound: false // weird -> it responds with ENOENT sometimes?!
    });
  }

  // async hasAnyChangedFiles() {
  //   const changes = await this.execCaptureOut(`${git} status -s`);
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
    if (!await this.gitDoesTagExistLocally(installedTag)) {
      this.log(`Installing...`);

      // delete unwanted files right away
      await this.deleteAssets();

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
    if (await project.gitDoesTagExistLocally(exerciseCachedTag)) {
      // get back to bug's original state
      try {
        await project._gitCheckout(exerciseCachedTag);
      }
      catch (err) {
        const diffObj = await this.gitDiff();
        const diffString = diffObj.out + '\n' + diffObj.err;
        this.logger.error(err);
        // eslint-disable-next-line max-len
        if (!await this.confirm(`Exercise reset failed due to pending changes. Do you want to git reset hard?\n${diffString || err.stack}`)) {
          // NOTE: we currently rely on that tag to exist
          throw new Error(`Abort! (${err.message})`);
        }
        else {
          await this._gitResetAndCheckout(exerciseCachedTag);
        }
      }
      const currentTags = await project.gitGetAllCurrentTagName();
      if (currentTags.includes(exerciseCachedTag)) {
        // hackfix: there is some bug here where `exerciseCachedTag` appears to exist, but we never stored it, and after checkout, it ends up in `installedTag` instead
        // -> $ git tag -l *dbux*
        successfulCacheFlag = true;
      }
      else {
        throw new Error(`installExercise failed - tried to checkout bug tag "${exerciseCachedTag}", but could not find tag (found: "${currentTags}"). Please re-install bug.`);
      }
    }

    if (!successfulCacheFlag) {
      // fresh start
      try {
        await project._gitCheckout(installedTag);
      }
      catch (err) {
        const diff = await this.gitDiff();
        this.logger.error(err);
        if (!await this.confirm(`First checkout of exercise failed due to pending changes. Do you want to git reset hard?\n${diff || err.stack}`)) {
          throw new Error(`Abort! (${err.message})`);
        }
        else {
          await this._gitResetAndCheckout(installedTag);
        }
      }

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
    if (successfulCacheFlag) {
      // re-install deps (because we might have switched between exercises)
      await project.npmInstall();
    }
    await project.autoCommit(`Installed assests.`);
  }

  /**
   * NOTE: This will only be called when the bug is run the first time.
   * @param {Exercise} exercise 
   */
  async selectExercise(exercise) {
    const { tag, commit } = exercise;
    if (tag || commit) {
      // checkout bug tag/commit
      const target = exercise.tag ? `tags/${tag}` : commit;
      const targetName = tag || commit;
      await this.gitCheckout(target, targetName);
    }
    else {
      // NOTE: selectDefaultCommit should not be necessary, since we rollback to install tag before calling this function
      // await this.selectDefaultCommit();
    }

    // apply patch
    await this.applyExercisePatches(exercise);
  }

  async applyExercisePatches(exercise) {
    if ('patch' in exercise) {
      if (exercise.patch) {
        // NOTE: this way we may set `bug.patch = null` to avoid applying any patch
        await this.applyPatches(exercise.patch);
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
      const files = this.getAllAssetFilesInProjectAbsolute()
        .map(f => pathRelative(this.projectPath, f))
        .map(f => `"${f}"`);
      // this.logger.debug(files.map(f => `${f}: ${fs.existsSync(f)}`));
      await this.exec(`${this.gitCommand} add ${files.join(' ')}`);

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

  async confirm(...args) {
    return this.manager.externals.confirm(...args);
  }

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
   * 1. select bug tag, 2. reset hard, 3. remove bug tag
   *    -> this should be the inverse of {@link Project#installBug}
   * TODO: make sure, individual overrides of {@link Project#selectExercise} don't do anything that is not undoable (or provide some sort of `uninstallBug` function)
   */
  async resetExercise(bug) {
    const installedTag = this.getProjectInstalledTagName();
    const exerciseCachedTag = this.getExerciseCachedTagTagName(bug);

    const currentTags = await this.gitGetAllCurrentTagName();
    if (currentTags.includes(exerciseCachedTag)) {
      // if (await this.gitDoesTagExistLocally(installedTag)) {
      // get back to project's original state
      await this._gitResetAndCheckout(installedTag);
      await this.npmInstall(); // NOTE: node_modules are not affected by git reset or checkout

      // make sure, there are no unwanted changes kicking around after install
      await this._gitResetAndCheckout(installedTag);
    }

    await this.gitDeleteTag(exerciseCachedTag);
  }

  /** ###########################################################################
   * cache
   *  #########################################################################*/

  /**
   * @param {Project} project 
   */
  async flushCacheConfirm() {
    // future-work: this might be the wrong cache folder, if `findCacheDir` resolves it differently
    //    -> offer an API to get (and/or flush) cache folder in babel-register (see `prepareCache`)
    const cacheRoot = this.getCacheRoot();
    const relativeProjectPath = this.getRelativeProjectPath();
    // const cacheFolderStr = `${relativeProjectPath}`;  // NOTE: path too long for modal
    if (this.doesCacheFolderExist()) {
      if (await this.manager.externals.confirm(`This will flush the cache at "${relativeProjectPath}", are you sure?\n (cacheRoot="${cacheRoot}")`)) {
        this.deleteCacheFolder();
        await this.manager.externals.alert(`Successfully deleted cache folder for project "${this.name}"`, true);
      }
    }
    else {
      await this.manager.externals.alert(`Cache for project "${this.name}" is empty: ${relativeProjectPath}\n (cacheRoot="${cacheRoot}")`, false);
    }
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
      if (!await this.gitDoesTagExistLocally(this.gitCommit)) {
        // await this.execInTerminal(`${this.gitCommand} fetch origin ${this.gitCommit}:${this.gitCommit}`);
        await this.execInTerminal(`${this.gitCommand} fetch origin ${this.gitCommit}`);
      }
      await this._gitResetAndCheckout(this.gitCommit);
    }
  }

  get packageJsonFolder() {
    return this.projectPath;
  }

  getNodeModulesFile(...segments) {
    return pathResolve(this.packageJsonFolder, 'node_modules', ...segments);
  }

  async npmInstall() {
    await this.ensurePackageJson();

    if (this.preferredPackageManager === 'yarn') {
      const { yarn } = this.manager.paths.inShell;
      await this.execInTerminal(`${yarn} install`, { cwd: this.packageJsonFolder });
    }
    else {
      // await this.exec('${npm} cache verify');
      // hackfix: npm installs are broken somehow.
      //      see: https://npm.community/t/need-to-run-npm-install-twice/3920
      //      Sometimes running it a second time after checking out a different branch 
      //      deletes all node_modules. The second run brings everything back correctly (for now).
      const { npm } = this.manager.paths.inShell;
      await this.execInTerminal(`${npm} install --legacy-peer-deps && ${npm} install --legacy-peer-deps`, { cwd: this.packageJsonFolder });
    }
  }

  // async yarnInstall() {
  //   await this.exec(`${yarn} install`);
  // }

  // ###########################################################################
  // assets
  // ###########################################################################

  async deleteAssets() {
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
  }

  /**
   * Copy all assets into project folder.
   */
  async installAssets(exercise = null) {
    // copy project assets
    const projectAssetsFolders = this.getAllAssetFolderPaths();
    projectAssetsFolders.forEach(folderName => {
      this.copyAssetFolder(folderName);
    });

    // copy exercise assets
    if (exercise) {
      let assetFolderPathOrPaths = this.getExerciseAssetFolderPaths(exercise);
      if (assetFolderPathOrPaths) {
        if (Array.isArray(assetFolderPathOrPaths)) {
          for (const assetPath of assetFolderPathOrPaths) {
            this.copyAssetFile(assetPath);
          }
        }
        else {
          if (!fs.existsSync(assetFolderPathOrPaths)) {
            throw new Error(`Experiment "${exercise.id}" should have assets but folder not found: "${assetFolderPathOrPaths}"`);
          }
          else {
            this.copyAssetFolder(assetFolderPathOrPaths);
          }
        }
      }
    }

    // make sure, we have node at given version and node@lts
    const nodeVersion = exercise && this.getCustomNodeVersion(exercise);
    if (nodeVersion) {
      // TODO: future-work user with dialog about needing volta
      this.logger.warn(`This project requires a specific node version. Trying to use volta to install and pin it...`);
      await this.exec(`volta fetch node@${nodeVersion} node@lts npm@lts`);
      await this.exec(`volta pin node@${nodeVersion}`);
    }
  }

  /**
   * @returns {string} absolute path of asset
   */
  getAssetPath(...segments) {
    // relative to dbux-internal asset path
    return this.manager.getAssetPath(...segments);
  }

  getAllAssetFolderPaths() {
    const assets = [
      this.builder?.sharedAssetFolder && this.getAssetPath(
        SharedAssetFolderName,
        this.builder.sharedAssetFolder
      ),
      this.getAssetPath(ProjectAssetFolderName, this.folderName)
    ];

    return assets.filter(assetPath => !!assetPath && sh.test('-d', assetPath));
  }

  /**
   * @param {Exercise} exercise 
   */
  getExerciseAssetFolderPaths(exercise) {
    if (exercise.hasAssets) {
      // copy all exercise assets from exercise-specific asset folder
      return this.getAssetPath(ExerciseAssetFolderName, this.name, exercise.name || exercise.number);
    }
    else if (exercise.assets) {
      // copy specific files
      if (isPlainObject(exercise.assets)) {
        throw new Error(`NYI: assets must be array. Objects containing from<->to mapping are not yet supported.`);
      }
      else if (Array.isArray(exercise.assets)) {
        return exercise.assets.map(relativeFilePath => {
          const from = this.getAssetPath(ExerciseAssetFolderName, this.name, relativeFilePath);
          const to = relativeFilePath;
          return [from, to];
        });
      }
      throw new Error(`assets must be array but found: ${typeof exercise.assets}`);
    }
    else {
      return null;
    }
  }

  getAllAssetFiles() {
    return this
      .getAllAssetFolderPaths()
      .flatMap(folder => {
        const files = globRelative(folder, '**/*');
        // hackfix: for some reason, `globRelative` sometimes picks up deleted files
        // add project dir for existsSync to work
        return files.filter(f => fs.existsSync(pathJoin(folder, f)));
      });
  }

  getAllAssetFilesInProjectAbsolute() {
    return this.getAllAssetFiles()
      .map(relativePath => this.getAssetFileInProject(relativePath));
  }

  /**
   * The folder that all assets should be copied to.
   * Usually {@link #projectPath}.
   */
  getAssetsTargetFolder() {
    return this.projectPath;
  }

  getAssetFileInProject(...segments) {
    return pathResolve(this.getAssetsTargetFolder(), ...segments);
  }

  copyAssetFolder(assetFolderPath) {
    const assetsTargetFolder = this.getAssetsTargetFolder();
    this.log(`Copying assets from ${assetFolderPath} to ${assetsTargetFolder}`);

    // Globs are tricky. See: https://stackoverflow.com/a/31438355/2228771
    const copyRes = sh.cp('-rf', `${assetFolderPath}/{.[!.],..?,}*`, assetsTargetFolder);

    const assetFiles = getAllFilesInFolders(assetFolderPath).join(',');
    this.log(`Copied assets (${assetFolderPath}): result=${copyRes.toString()}, files=${assetFiles}`,
      // this.execCaptureOut(`cat ${assetsTargetFolder}/.babelrc.js`)
    );
  }

  copyAssetFile(assetPath) {
    const assetsTargetFolder = this.getAssetsTargetFolder();
    // this.log(`Copying asset from ${assetFolderPath} to ${assetsTargetFolder}`);
    let from, to;
    if (Array.isArray(assetPath)) {
      ([from, to] = assetPath);
    }
    else {
      from = assetPath;
      to = '';
    }

    // make sure, file exists
    if (!fs.existsSync(from)) {
      throw new Error(`Asset file does not exist: "${from}"`);
    }

    // resolve target file path
    const toAbsolute = pathResolve(assetsTargetFolder, to);
    if (!isFileInPath(assetsTargetFolder, toAbsolute)) {
      throw new Error(`Asset "to" file=${to} is not (but must be) relative to assetsTargetFolder="${assetsTargetFolder}" (${assetPath})`);
    }
    const toFolder = path.dirname(toAbsolute);
    if (!fs.existsSync(toFolder)) {
      fs.mkdirSync(toFolder, { recursive: true });
    }

    /**
     * Globs are tricky.
     * @see https://stackoverflow.com/a/31438355/2228771
     */
    const copyRes = sh.cp('-rf', from, toAbsolute);

    // const assetFiles = getAllFilesInFolders(assetFolderPath).join(',');
    this.log(`Copied asset (${toAbsolute}): result=${copyRes.toString()}`);
  }

  // ###########################################################################
  // patches
  // ###########################################################################

  getPatchFolder() {
    return pathJoin(this.getAssetPath(PatchFolderName), this.folderName);
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
        `apply ${revert ? '-R ' : ''}--ignore-space-change --ignore-whitespace "${patchPath}"`
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
   * cd dbux_projects/X
   * git diff --color=never --ignore-cr-at-eol | unix2dos > ../../dbux-projects/assets/patches/X/error1.patch
   */
  async getPatchString() {
    await this.checkCorrectGitRepository();

    return this.execCaptureOut(`${this.gitCommand} diff --color=never --ignore-cr-at-eol`);
  }

  // ###########################################################################
  // tags
  // ###########################################################################

  async getCurrentBugFromTag() {
    if (await this.isGitInitialized()) {
      for (const tag of (await this.gitGetAllCurrentTagName())) {
        const exercise = this.parseExerciseCachedTag(tag);
        if (exercise) {
          return exercise;
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
    const tags = (await this.execCaptureOut(`${this.gitCommand} tag --points-at HEAD`)).split(/\r?\n/);
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

  async gitDoesTagExistLocally(tag) {
    await this.checkCorrectGitRepository();
    try {
      await this.execGitCaptureErr(`rev-parse "${tag}" --`, { failOnStatusCode: false });
      return true;
    }
    catch (err) {
      this.logger.log(err.message);
      return false;
    }
    /**
     * "git tag -l" cannot resolve some tag format, e.g. tags/v3.7.2 of bluebird
     */
    // const result = await this.execCaptureOut(`${this.gitCommand} tag -l "${tag}" --`);
    // return !!result;
  }

  getProjectInstalledTagName() {
    return GitInstalledTag;
  }

  getExerciseCachedTagTagName(exercise) {
    return `__dbux_exercise_${exercise.id}_selected`;
  }

  parseExerciseCachedTag(tagName) {
    const exerciseId = tagName.match(/__dbux_exercise_([^_]*)_selected/)?.[1];
    if (exerciseId) {
      const exercise = this._exercises.getById(exerciseId);
      if (!exercise) {
        this.logger.warn(`Found exerciseId "${exerciseId}" from tag, but exercise of that id does not exist.`);
      }
      return exercise;
    }
    else {
      return null;
    }
  }

  // ###########################################################################
  // exercises
  // ###########################################################################

  getExercisePath(exerciseFileName = this.name) {
    return this.getAssetPath('exercises', `${exerciseFileName}.js`);
  }

  /**
   * @return {ExerciseConfig[]}
   */
  loadExerciseConfigs(exerciseFileName) {
    const rawConfigFile = this.getExercisePath(exerciseFileName);
    try {
      const configs = requireUncached(rawConfigFile);
      return configs;
    }
    catch (err) {
      this.logger.error(`Cannot load exercises for project "${this.name}": ${err.stack}`);
      return EmptyArray;
    }
  }

  /**
   * Get all exercises for this project
   * @return {ExerciseList}
   */
  reloadExercises(exerciseFileName) {
    let exerciseConfigs = this.loadExerciseConfigs(exerciseFileName)
      .filter(this.canRunExercise.bind(this))
      .map(this.decorateExercise.bind(this));
    this.logger.debug(`[reloadExercises] found ${exerciseConfigs.length} in "${exerciseFileName}"`);
    const hasIds = exerciseConfigs.some(exercise => !!exercise.id);
    let lastExercise = 0;

    let exercises = exerciseConfigs.map(config => {
      // exercise.description
      // let {
      //   description,
      //   testRe,
      //   testFilePaths
      // } = config;
      // config.description = description || testRe || testFilePaths?.[0] || '';

      // exercise.number
      if (!config.number) {
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
      if (config.name) {
        config.uniqueName = `${this.name}#${config.name}`;
      }
      return new Exercise(this, config);
    });

    if (process.env.NODE_ENV === 'production') {
      exercises = exercises.filter(exercise => exercise.label);
    }

    // this.logger.debug(
    //   `loaded ${exercises.length} exercises: ` +
    //   exercises.
    //     map(ex => `${ex.id}${ex.uniqueName && ` (${ex.uniqueName})` || ''}`).
    //     join(', ')
    // );

    this._exercises = new ExerciseList(exercises);

    for (const exercise of exercises) {
      this.manager.registerNewExercise(exercise);
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
  async runCommand(exercise, cfg) {
    const runCfg = {
      env: {
      }
    };


    if (!exercise.testFilePaths || !exercise.testFilePaths[0]) {
      throw new Error(`exercise.testFilepaths are missing for "${exercise.id}"`);
    }
    const program = exercise.testFilePaths[0];

    return [
      buildNodeCommand({
        ...cfg,
        program
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