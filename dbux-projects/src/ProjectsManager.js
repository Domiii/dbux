import path from 'path';
import fs from 'fs';
import sh from 'shelljs';
import NanoEvents from 'nanoevents';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import { readPackageJson } from '@dbux/cli/lib/package-util';
import caseStudyRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import BugRunner from './projectLib/BugRunner';
import PracticeSession from './practiceSession/PracticeSession';
import RunStatus from './projectLib/RunStatus';
import BugStatus from './dataLib/BugStatus';
import BackendController from './backend/BackendController';
import ProgressLogController from './dataLib/ProgressLogController';
import PracticeSessionState from './practiceSession/PracticeSessionState';

const logger = newLogger('PracticeManager');
// eslint-disable-next-line no-unused-vars
const { debug, log, warn, error: logError } = logger;

const depsStorageKey = 'PracticeManager.deps';
const activatedBugKeyName = 'dbux.dbux-projects.activatedBug';
const currentlyPracticingBugKeyName = 'dbux.dbux-projects.currentlyPracticingBug';

/** @typedef {import('./projectLib/Project').default} Project */
/** @typedef {import('./projectLib/Bug').default} Bug */
/** @typedef {import('./externals/Storage').default} ExternalStorage */


function canIgnoreDependency(name) {
  if (process.env.NODE_ENV === 'development' && name.startsWith('@dbux/')) {
    // NOTE: in development mode, we have @dbux dependencies (and their dependencies) all linked up to the monoroot folder anyway
    // NOTE: we need to short-circuit this for when we run the packaged extension in dev mode
    return true;
  }
  return false;
}

export default class ProjectsManager {
  /**
   * @type {PracticeSession}
   */
  practiceSession;
  /**
   * @type {ProjectList}
   */
  projects;
  /**
   * @type {BugRunner}
   */
  runner;
  /**
   * @type {BackendController}
   */
  _backend;

  _pkg;
  _sharedDependencyNamesToCheck;

  // NOTE: npm flattens dependency tree by default, and other important dependencies are dependencies of @dbux/cli
  _sharedDependencyNames = [
    '@dbux/cli'
  ];

  /**
   * @param {Object} externals 
   * @param {ExternalStorage} externals.storage
   */
  constructor(cfg, externals) {
    this.config = cfg;
    this.externals = externals;
    this.editor = externals.editor;
    this.practiceSession = null;
    this.runner = new BugRunner(this);
    this.runner.start();
    this._emitter = new NanoEvents();

    this._backend = new BackendController(this);
    this.progressLogController = new ProgressLogController(this);

    this.recoverPracticeSession();

    // Note: we need this to check if any dependencies are missing (not to install them)
    this._pkg = readPackageJson(this.config.dependencyRoot);
    this._sharedDependencyNamesToCheck = [
      ...this._sharedDependencyNames,
      ...Object.entries(this._pkg.dependencies).
        map(([name, version]) => `${name}@${version}`)
    ];
  }

  get plc() {
    return this.progressLogController;
  }

  get runStatus() {
    return this.runner.status;
  }

  async getAndInitBackend() {
    await this._backend.init();
    return this._backend;
  }

  /**
   * Retrieves all case study objects, 
   * sorted by name (in descending order).
   */
  getOrCreateDefaultProjectList() {
    if (!this.projects) {
      // fix up names
      for (const name in caseStudyRegistry) {
        const Clazz = caseStudyRegistry[name];

        // NOTE: function/class names might get mangled by Webpack (or other bundlers/tools)
        Clazz.constructorName = name;
      }

      // sort all classes by name
      const classes = Object.values(caseStudyRegistry);
      classes.sort((a, b) => {
        const nameA = a.constructorName.toLowerCase();
        const nameB = b.constructorName.toLowerCase();
        return nameB.localeCompare(nameA);
      });

      // build + return ProjectList
      const list = new ProjectList(this);
      list.add(...classes.map(ProjectClazz =>
        new ProjectClazz(this)
      ));

      this.projects = list;
    }

    return this.projects;
  }

  // ###########################################################################
  // practice flow management (new)
  // ###########################################################################

  async startPractice(bug) {
    if (this.practiceSession) {
      warn(`Trying to start practiceSession of bug ${bug.id} before one is finished`);
      return;
    }

    let bugProgress = this.plc.util.getBugProgressByBug(bug);

    if (!bugProgress) {
      const stopwatchEnabled = await this.askForStopwatch();
      bugProgress = this.plc.addBugProgress(bug, BugStatus.Solving, stopwatchEnabled);
      this.practiceSession = new PracticeSession(bug, this);
      this._emitter.emit('practiceSessionChanged', this.practiceSession);

      // activate once to show user the bug, don't care about the result
      await this._activateBug(bug, false);

      this.plc.updateBugProgress(bug, { startedAt: Date.now() });
    }
    else {
      this.practiceSession = new PracticeSession(bug, this);
      this._emitter.emit('practiceSessionChanged', this.practiceSession);
    }

    if (this.practiceSession.stopwatchEnabled) {
      // set stopwatch
      const { startedAt } = bugProgress;
      this.practiceSession.stopwatch.set(Date.now() - startedAt);
      this.practiceSession.stopwatch.show();
      this.practiceSession.stopwatch.start();
    }

    await this.setKeyToBug(currentlyPracticingBugKeyName, bug);

    await this.plc.save();
  }

  async stopPractice() {
    if (!this.practiceSession) {
      return;
    }

    await this.stopRunner();
    
    const { stopwatchEnabled, state, stopwatch } = this.practiceSession;
    
    if (stopwatchEnabled && !PracticeSessionState.is.Solved(state)) {
      this.practiceSession.giveup();
    }
    stopwatch.pause();
    stopwatch.hide();
    this.practiceSession = null;
    await this.setKeyToBug(currentlyPracticingBugKeyName, undefined);
    this._emitter.emit('practiceSessionChanged', this.practiceSession);
  }

  recoverPracticeSession() {
    const bug = this.getBugByKey(currentlyPracticingBugKeyName);
    if (!bug) {
      return;
    }
    const bugProgress = this.plc.util.getBugProgressByBug(bug);
    if (!bugProgress) {
      warn(`Can't find bugProgress when starting existing PracticeSession for bug ${bug.id}`);
      return;
    }

    this.practiceSession = new PracticeSession(bug, this);

    if (this.practiceSession.stopwatchEnabled) {
      // set stopwatch
      const { startedAt } = bugProgress;
      this.practiceSession.stopwatch.set(Date.now() - startedAt);
      this.practiceSession.stopwatch.show();
      this.practiceSession.stopwatch.start();
    }

    this._emitter.emit('practiceSessionChanged', this.practiceSession);
  }

  async activate(debugMode) {
    await this.practiceSession.activate(debugMode);
  }

  onPracticeSessionChanged(cb) {
    return this._emitter.on('practiceSessionChanged', cb);
  }

  // ###########################################################################
  // practice flow management
  // ###########################################################################

  // /**
  //  * Currently the only public function to user
  //  * NOTE: should handle practice flow carefully
  //  * @param {Bug} bug 
  //  * @param {boolean} debugMode 
  //  */
  // async activateBug(bug, debugMode = false) {
  //   if (this.practiceSession) {
  //     if (this.practiceSession.bug === bug) {
  //       // re-active same bug
  //       await this.practiceSession.activate(debugMode);
  //       if (PracticeSessionState.is.Solved(this.practiceSession.state)) {
  //         await this.clearPracticeSession();
  //       }
  //       return;
  //     }
  //     else {
  //       // already a practice session, ask to stop first
  //       const bugId = this.practiceSession.bug.id;
  //       const confirmMsg = `You are currently practicing ${bugId}, do you want to give up?`;
  //       const confirmResult = await this.externals.confirm(confirmMsg, true);
  //       if (confirmResult) {
  //         await this.giveupPractice();
  //         this.externals.showMessage.info('Practice session quitted');
  //       }
  //       else {
  //         await this.plc.save();
  //         return;
  //       }
  //     }
  //   }

  //   const bugProgress = this.plc.util.getBugProgressByBug(bug);
  //   if (!bugProgress) {
  //     // first time start it, ask to start timer
  //     const confirmMsg = `This is your first time activate this bug, do you want to start a timer?\n`
  //       + `[WARN] You will not be able to time this bug once you activate it.`;
  //     const confirmResult = await this.externals.confirm(confirmMsg, true);
  //     if (confirmResult) {
  //       this.practiceSession = await this._createPracticeSession(bug, true, debugMode);
  //     }
  //     else if (confirmResult === false) {
  //       this.plc.addBugProgress(bug, BugStatus.None, false);
  //       await this.plc.save();
  //       await this._activateBug(bug, debugMode);
  //     }
  //   }
  //   else if (bugProgress.stopwatchEnabled && !BugStatus.is.Solved(bugProgress.status)) {
  //     // already practicing, keep going on
  //     this.practiceSession = await this._createPracticeSession(bug, true, debugMode);
  //   }
  //   else {
  //     // no need to start timer
  //     const result = await this._activateBug(bug, debugMode);
  //     this.updateBugStatusByResult(bug, result);
  //     this._emitter.emit('bugStatusChanged', bug);
  //     await this.plc.save();
  //   }

  //   await this.plc.save();
  // }

  // async giveupPractice() {
  //   if (!this.practiceSession) {
  //     return;
  //   }

  //   await this.runner.cancel();
  //   const { bug } = this.practiceSession;
  //   this.plc.updateBugProgress(bug, { stopwatchEnabled: false });
  //   this._emitter.emit('bugStatusChanged', bug);
  //   await this.plc.save();
  //   await this.clearPracticeSession();
  // }

  // /**
  //  * Starts a practice session and activate the bug once, promise resolve after all is done
  //  * @param {Bug} bug
  //  * @return {Promise<PracticeSession>}
  //  */
  // async _createPracticeSession(bug, runTest, debugMode) {
  //   // load existing bugProgress
  //   let bugProgress = this.plc.util.getBugProgressByBug(bug);
  //   if (!bugProgress) {
  //     bugProgress = this.plc.addBugProgress(bug, BugStatus.Solving, true);
  //   }
  //   else if (!bugProgress.stopwatchEnabled) {
  //     throw new Error('Trying to create practiceSession without timer enabled');
  //   }

  //   const practiceSession = new PracticeSession(bug, this);
  //   practiceSession.setState(PracticeSessionState.Activating);

  //   let { startedAt } = bugProgress;
  //   practiceSession.stopwatch.show();
  //   if (startedAt) {
  //     practiceSession.stopwatch.set(Date.now() - startedAt);
  //     practiceSession.stopwatch.start();
  //   }

  //   // activate once to show user the bug, don't care about the result
  //   runTest && await this._activateBug(bug, debugMode);

  //   // set stopwatch
  //   if (!startedAt) {
  //     startedAt = Date.now();
  //     this.plc.updateBugProgress(bug, { startedAt });
  //     practiceSession.stopwatch.set(Date.now() - startedAt);
  //     practiceSession.stopwatch.start();
  //   }

  //   practiceSession.setState(PracticeSessionState.Solving);

  //   await this.setKeyToBug(currentlyPracticingBugKeyName, bug);
  //   return practiceSession;
  // }

  // async clearPracticeSession() {
  //   if (!this.practiceSession) {
  //     return;
  //   }

  //   this.practiceSession.clear();
  //   await this.setKeyToBug(currentlyPracticingBugKeyName, undefined);

  //   this.practiceSession = null;
  // }

  /**
   * Install and run a bug, then save testRun after result
   * NOTE: Only used internally to manage practice flow
   * @param {Bug} bug 
   * @param {boolean} debugMode
   */
  async _activateBug(bug, debugMode) {
    const previousBug = this.getPreviousBug();

    // if some bug are already activated, save the changes
    if (bug !== previousBug) {
      if (previousBug) {
        await this.saveFileChanges(previousBug);
        await previousBug.project.gitResetHard();
      }

      await this.updateActivatingBug(bug);
    }

    // install things
    if (!this.runner.isBugActive(bug)) {
      await this.runner.activateBug(bug);
    }

    // apply stored patch
    if (bug !== previousBug) {
      try {
        await this.applyNewBugPatch(bug);
      } catch (err) {
        const keepRunning = await this.externals.showMessage.warning(`Failed when applying previous progress of this bug.`, {
          async 'Show diff in new tab and cancel'() {
            await this.externals.editor.showTextInNewFile(`diff.diff`, err.patchString);
            return false;
          },
          'Ignore and keep running': () => {
            return true;
          },
        }, { modal: true });

        if (!keepRunning) {
          throw err;
        }
      }
    }

    // NOTE: --enable-source-maps gets super slow in production mode for some reason
    // NOTE2: nolazy is required for proper breakpoints in debug mode
    // const enableSourceMaps = '--enable-source-maps';
    const enableSourceMaps = '';
    const nodeArgs = `--stack-trace-limit=100 ${debugMode ? '--nolazy' : ''} ${enableSourceMaps}`;
    const cfg = {
      debugMode,
      nodeArgs,
      dbuxArgs: '--verbose=1'
    };

    const result = await this.runner.testBug(bug, cfg);

    await this.plc.addTestRunWithoutPatchString(bug, result);

    result.code && await bug.openInEditor();

    return result;
  }

  async askForSubmit() {
    const confirmString = 'Congratulations!! You have passed all test 🎉🎉🎉\nWould you like to submit the result?';
    const shouldSubmit = await this.externals.confirm(confirmString);

    if (shouldSubmit) {
      this.submit();
    }
  }

  /**
   * Record the practice session data after user passed all tests.
   */
  submit() {
    // TODO: maybe a new data type? or submit remotely?
  }

  /**
   * Saves any changes in current active project as patch of bug
   * @param {Bug} bug 
   */
  async saveFileChanges(bug) {
    const patchString = await bug.project.getPatchString();
    if (patchString) {
      this.plc.addUnfinishedTestRun(bug, patchString);
      await this.plc.save();
    }
  }

  /**
   * @param {Bug} bug 
   */
  async resetBug(bug) {
    await bug.project.gitResetHard(true, 'This will discard all your changes on this bug.');
    this.plc.addUnfinishedTestRun(bug, '');
    await this.plc.save();
  }

  /**
   * Apply the newest patch in testRuns
   * @param {Bug} bug
   */
  async applyNewBugPatch(bug) {
    let testRuns = this.plc.util.getTestRunsByBug(bug);
    let testRun = testRuns.reduce((a, b) => {
      if (!a) {
        return b;
      }
      return a.createdAt > b.createdAt ? a : b;
    }, undefined);
    let patchString = testRun?.patch;

    if (patchString) {
      const { project } = bug;
      try {
        await project.applyPatchString(patchString);
      }
      catch (err) {
        err.patchString = patchString;
        throw err;
      }
    }
  }

  // ###########################################################################
  // BugRunner interface
  // ###########################################################################

  async stopRunner() {
    await this.runner.cancel();
  }

  // ###########################################################################
  // Project/Bug run status getter
  // ###########################################################################

  /**
   * @param {Project} project 
   */
  getProjectRunStatus(project) {
    if (this.runner.isProjectActive(project)) {
      return this.runner.status;
    }
    else {
      return RunStatus.None;
    }
  }

  /**
   * @param {Bug} bug 
   */
  getBugRunStatus(bug) {
    if (this.runner.isBugActive(bug)) {
      return this.runner.status;
    }
    else {
      return RunStatus.None;
    }
  }

  onRunStatusChanged(cb) {
    return this.runner.onStatusChanged(cb);
  }

  onBugStatusChanged(cb) {
    return this._emitter.on('bugStatusChanged', cb);
  }

  // ###########################################################################
  // Progress Log
  // ###########################################################################

  async resetProgress() {
    await this.plc.reset();
    await this.setKeyToBug(currentlyPracticingBugKeyName, undefined);
    await this.updateActivatingBug(undefined);
  }

  getDevPackageRoot() {
    // NOTE: __dirname is actually "..../dbux-code/dist", because of webpack
    return fs.realpathSync(path.join(__dirname, '..', '..'));
  }

  // _convertPkgToLocalIfNecessary(pkgName, version = null) {
  //   // NOTE: only dbux packages are available locally
  //   const packageRoot = this.getDevPackageRoot();

  //   if (process.env.NODE_ENV === 'development') {
  //     const match = pkgName.match(/@dbux\/(.+)/);
  //     if (match) {
  //       // available locally
  //       return `file://${packageRoot}/dbux-${match[1]}`;
  //     }
  //   }
  //   if (!version) {
  //     throw new Error('no version given for package: ' + pkgName);
  //   }
  //   return `${pkgName}@${version}`;
  // }

  // _readLocalPkgDeps(pkgFolder, ...depNames) {
  //   const pkg = readPackageJson(pkgFolder);
  //   let deps;
  //   if (depNames.length) {
  //     deps = pick(pkg.dependencies, depNames);
  //     if (size(deps) !== depNames.length) {
  //       throw new Error(`Could not read (some subset of the following) local package dependencies: ${depNames.join(', ')}`);
  //     }
  //   }
  //   else {
  //     deps = pkg.dependencies;
  //   }
  //   return Object.
  //     entries(deps).
  //     map(([pkgName, version]) => `${this._convertPkgToLocalIfNecessary(pkgName, version)}`);
  // }

  getDbuxCliBinPath() {
    return this.getDbuxPath('@dbux/cli/bin/dbux.js');
  }

  getDbuxPath(relativePath) {
    return path.join(this.getDbuxRoot(), 'node_modules', relativePath);
  }

  getDbuxRoot() {
    if (process.env.DBUX_ROOT) {
      // if we install in dev mode, DBUX_ROOT is set, but we are not in it
      return process.env.DBUX_ROOT;
    }
    // in production mode, we must install dbux separately
    return this.config.dependencyRoot;
  }

  // ###########################################################################
  // Bug saves
  // ###########################################################################

  /**
   * @param {Bug} bug 
   */
  async updateActivatingBug(bug) {
    await this.setKeyToBug(activatedBugKeyName, bug);
  }

  /**
   * @return {Bug}
   */
  getPreviousBug() {
    return this.getBugByKey(activatedBugKeyName);
  }

  /**
   * @param {string} key 
   * @param {Bug} bug 
   */
  async setKeyToBug(key, bug) {
    if (bug === undefined) {
      await this.externals.storage.set(key, undefined);
    }
    else {
      await this.externals.storage.set(key, {
        projectName: bug.project.name,
        bugId: bug.id
      });
    }
  }

  /**
   * @param {string} key 
   * @return {Bug}
   */
  getBugByKey(key) {
    const bugInfo = this.manager.externals.storage.get(key);

    if (bugInfo) {
      const { projectName, bugId } = bugInfo;
      const previousProject = this.manager.getOrCreateDefaultProjectList().getByName(projectName);

      if (previousProject?.isProjectFolderExists()) {
        return previousProject.getOrLoadBugs().getById(bugId);
      }
      else {
        this.logger.warn(`Found bug by key='${key}', but project does not exist: ${JSON.stringify(bugInfo)}`);
      }
    }
    return null;
  }


  // ###########################################################################
  // Dependency Management
  // ###########################################################################

  async installDependencies() {
    await this.installDbuxDependencies();
  }

  isInstallingSharedDependencies() {
    return !!this._installPromise;
  }

  async waitForInstall() {
    return this._installPromise;
  }

  _getAllDependenciesToCheck(deps) {
    return [
      ...this._sharedDependencyNamesToCheck,
      ...deps || EmptyArray
    ];
  }

  hasInstalledSharedDependencies() {
    return this.areDependenciesInstalled([]);
  }

  areDependenciesInstalled(deps) {
    deps = this._getAllDependenciesToCheck(deps);
    return deps.every(this.isDependencyInstalled);
  }

  isDependencyInstalled = (dep) => {
    // TODO: check correct version?
    //    should not be necessary for the VSCode extension because it will create a new extension folder for every version update anyway

    // get name without version
    const name = dep.match('(@?[^@]+)(?:@.*)?')[1];
    if (canIgnoreDependency(name)) {
      // NOTE: in development mode, we have @dbux dependencies (and their dependencies) all linked up to the monoroot folder anyway
      // NOTE: we need to short-circuit this for when we run the packaged extension in dev mode
      return true;
    }
    const { dependencyRoot } = this.config;

    // if (process.env.NODE_ENV === 'production' && !this.externals.storage.get(depsStorageKey)?.[dep]) {
    //   // we don't have any record of a successful install
    //   return false;
    // }

    const target = path.join(dependencyRoot, 'node_modules', name);
    // warn('isDependencyInstalled', qualifiedDependencyName, target);

    return sh.test('-d', target);
  }

  async installDbuxDependencies() {
    // set correct version
    if (!process.env.DBUX_VERSION) {
      throw new Error('installDbuxDependencies() failed. DBUX_VERSION was not set.');
    }

    const deps = this._sharedDependencyNames.
      map(dep => `${dep}@${process.env.DBUX_VERSION}`).
      filter(dep => !canIgnoreDependency(dep));

    await this.installModules(deps);
  }

  async installModules(deps) {
    await this._installPromise;
    return (this._installPromise = this._doInstallModules(deps));
  }

  async _doInstallModules(deps) {
    try {
      const { dependencyRoot } = this.config;
      // const execOptions = {
      //   processOptions: {
      //     cwd: dependencyRoot
      //   }
      // };
      // if (!sh.test('-f', rootPackageJson)) {
      //   // make sure, we have a local `package.json`
      //   await this.runner._exec('npm init -y', logger, execOptions);
      // }
      if (this.areDependenciesInstalled(deps)) {
        // already done!
        return;
      }

      // delete previously installed node_modules
      // NOTE: if we don't do it, we (sometimes randomly) bump against https://github.com/npm/npm/issues/13528#issuecomment-380201967
      // await sh.rm('-rf', path.join(projectsRoot, 'node_modules'));

      // debug(`Verifying NPM cache. This might (or might not) take a while...`);
      // await this.runner._exec('npm cache verify', logger, execOptions);

      // this.externals.showMessage.info(`Installing dependencies: "${deps.join(', ')}" This might (or might not) take a while...`);

      const moreDeps = deps.length && ` && npm i ${deps.join(' ')}` || '';
      const command = `npm install --only=prod${moreDeps}`;
      // await this.runner._exec(command, logger, execOptions);
      await this.execInTerminal(dependencyRoot, command);

      // remember all installed dependencies
      // const newDeps = this._getAllDependencies();
      // let storedDeps = this.externals.storage.get(depsStorageKey) || {};
      // storedDeps = {
      //   ...storedDeps, 
      //   ...Object.fromEntries(newDeps.map(dep => [dep, true]))
      // };
      // await this.externals.storage.set(depsStorageKey, storedDeps);

      // else {
      //   // we need socket.io for TerminalWrapper. Its version should match dbux-runtime's.
      //   // const pkgPath = path.join(__dirname, '..', '..', '..', 'dbux-runtime');

      //   const packageRoot = process.env.DBUX_ROOT;
      //   const cliPath = path.join(packageRoot, 'dbux-cli');
      //   const cliDeps = this._readLocalPkgDeps(cliPath);

      //   const runtimePath = path.join(packageRoot, 'dbux-runtime');
      //   const socketIoDeps = this._readLocalPkgDeps(runtimePath, 'socket.io-client');
      //   // const socketIoVersion = pkg?.dependencies?.[socketIoName]; // ?.match(/\d+\.\d+.\d+/)?.[0];

      //   // if (!socketIoVersion) {
      //   //   throw new Error(`'Could not retrieve version of ${socketIoName} in "${runtimePath}"`);
      //   // }

      //   allDeps = [
      //     // NOTE: installing local refs actually *copies* them. We don't want that.
      //     // we will use `module-alias` in `_dbux_inject.js` instead
      //     // this._convertPkgToLocalIfNecessary('@dbux/cli'),
      //     ...cliDeps.filter(dep => !dep.includes('dbux-')),
      //     ...socketIoDeps
      //   ];

      //   // NOTE: `link-module-alias` can cause problems. See: https://github.com/Rush/link-module-alias/issues/3
      //   // // add dbux deps via `link-module-alias`
      //   // const dbuxDeps = [
      //   //   'common',
      //   //   'cli',
      //   //   'babel-plugin',
      //   //   'runtime'
      //   // ];
      //   // let pkg = readPackageJson(projectsRoot);
      //   // pkg = {
      //   //   ...pkg,
      //   //   script: {
      //   //     postinstall: "npx link-module-alias"
      //   //   },
      //   //   _moduleAliases: Object.fromEntries(
      //   //     dbuxDeps.map(name => [`@dbux/${name}`, `../dbux/dbux-${name}`])
      //   //   )
      //   // };

      //   // await this.runner._exec(`npm i --save link-module-alias`, logger, execOptions);
      //   // writePackageJson(projectsRoot, pkg);
      //   await this.runner._exec(`npm i --save ${allDeps.join(' ')}`, logger, execOptions);
      // }
    }
    finally {
      this._installPromise = null;
    }
  }

  // ###########################################################################
  // utilities
  // ###########################################################################

  /**
   * @return {Promise<boolean>}
   */
  async askForStopwatch() {
    const confirmMsg = `This is your first time activate this bug, do you want to start a timer?\n`
      + `[WARN] You will not be able to time this bug once you activate it.`;
    return await this.externals.confirm(confirmMsg, true);
  }

  async execInTerminal(cwd, command, args) {
    try {
      this._terminalWrapper = this.externals.TerminalWrapper.execInTerminal(cwd, command, args);
      return await this._terminalWrapper.waitForResult();
    }
    finally {
      this._terminalWrapper?.cancel();
      this._terminalWrapper = null;
    }
  }

  onTestFinished(cb) {
    return this.runner._emitter.on('testFinished', cb);
  }

  /**
   * @param {Object} result 
   * @param {number} result.code
   */
  getResultStatus(result) {
    return result.code ? BugStatus.Attempted : BugStatus.Solved;
  }
}