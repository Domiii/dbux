import path from 'path';
import fs from 'fs';
import sh from 'shelljs';
import NanoEvents from 'nanoevents';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import { realPathSyncNormalized } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { readPackageJson } from '@dbux/cli/lib/package-util';
import projectRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import BugRunner from './projectLib/BugRunner';
import PracticeSession from './practiceSession/PracticeSession';
import BugStatus from './dataLib/BugStatus';
import BackendController from './backend/BackendController';
import PathwaysDataProvider from './dataLib/PathwaysDataProvider';
import PracticeSessionState from './practiceSession/PracticeSessionState';
import { initUserEvent, emitSessionFinishedEvent, emitPracticeSessionEvent, onUserEvent, emitUserEvent } from './userEvents';
import BugDataProvider from './dataLib/BugDataProvider';
import initLang, { getTranslationScope } from './lang';
import upload from './fileUpload';
import { checkSystemWithRequirement } from './checkSystem';

const logger = newLogger('PracticeManager');
// eslint-disable-next-line no-unused-vars
const { debug, log, warn, error: logError } = logger;

const depsStorageKey = 'PracticeManager.deps';
const savedPracticeSessionKeyName = 'dbux.dbux-projects.currentlyPracticingBug';
const savedPracticeSessionDataKeyName = 'dbux.dbux-projects.practiceSessionCreatedAt';

/** @typedef {import('./projectLib/Project').default} Project */
/** @typedef {import('./projectLib/Bug').default} Bug */
/** @typedef {import('./externals/Storage').default} ExternalStorage */
/** @typedef {import('dbux-code/src/terminal/TerminalWrapper').default.constructor} TerminalWrapperClass */
/** @typedef {import('dbux-code/src/terminal/TerminalWrapper').default} TerminalWrapper */


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
    '@dbux/cli',

    // // webpack is used by most projects
    // 'webpack@^4.43.0',
    // 'webpack-cli@^3.3.11',

    // // these are used in dbux.webpack.config.base.js
    // 'copy-webpack-plugin@6'
  ];

  _systemRequirement = {
    node: {},
  };

  /**
   * // NOTE: does not work - https://github.com/jsdoc/jsdoc/issues/1349
   * @type {{
   *   TerminalWrapper: TerminalWrapperClass
   * }}
   */
  externals;

  // ###########################################################################
  // ctor, init, load
  // ###########################################################################

  /**
   * @param {Object} externals 
   * @param {ExternalStorage} externals.storage
   */
  constructor(cfg, externals) {
    this.config = cfg;
    this.getDbuxCliBinPath();
    if (!this.config.dependencyRoot) {
      throw new Error(`ProjectsManager missing dependencyRoot: ${JSON.stringify(this.config)}`);
    }
    this.externals = externals;
    this.editor = externals.editor;
    this.practiceSession = null;
    this.runner = new BugRunner(this);
    this.runner.start();
    this._emitter = new NanoEvents();

    this._backend = new BackendController(this);

    this.pathwayDataProvider = new PathwaysDataProvider(this);
    this.bugDataProvider = new BugDataProvider(this);

    // Note: we need this to check if any dependencies are missing (not to install them)
    this._pkg = readPackageJson(this.config.dependencyRoot);
    this._sharedDependencyNamesToCheck = [
      ...this._sharedDependencyNames,
      ...Object.entries(this._pkg.dependencies).
        map(([name, version]) => `${name}@${version}`)
    ];

    initUserEvent(this);

    // NOTE: This is for public API. To emit event in dbux-projects, register event in dbux-projects/src/userEvents.js and import it directly 
    this.onUserEvent = onUserEvent;
    this.emitUserEvent = emitUserEvent;
  }

  async init() {
    await this.recoverPracticeSession();
    await initLang(this.config.dbuxLanguage);
  }

  /**
   * Retrieves all case study objects, 
   * sorted by name (in descending order).
   */
  getOrCreateDefaultProjectList() {
    if (!this.projects) {
      // fix up names
      for (const name in projectRegistry) {
        const Clazz = projectRegistry[name];

        // NOTE: function/class names might get mangled by Webpack (or other bundlers/tools)
        Clazz.constructorName = name;
      }

      // sort all classes by name
      const classes = Object.values(projectRegistry);
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

  addProject() {

  }

  // ###########################################################################
  // getters
  // ###########################################################################

  get pdp() {
    return this.pathwayDataProvider;
  }

  get bdp() {
    return this.bugDataProvider;
  }

  async getAndInitBackend() {
    await this._backend.init();
    return this._backend;
  }

  // ###########################################################################
  // PracticeSession
  // ###########################################################################

  async startPractice(bug) {
    if (!await this.stopPractice()) {
      return;
    }

    await checkSystemWithRequirement(this, this._systemRequirement);

    const bugProgress = this.bdp.getBugProgressByBug(bug);
    if (!bugProgress) {
      const stopwatchEnabled = await this.askForStopwatch();
      this.bdp.addBugProgress(bug, BugStatus.Solving, stopwatchEnabled);
      this.bdp.updateBugProgress(bug, { startedAt: Date.now() });
    }

    bug.project.initProject();
    await this.switchToBug(bug);
    this._resetPracticeSession(bug);
    this.practiceSession.setupStopwatch();
    await this.savePracticeSession();
    await this.bdp.save();
    this.maybeAskForTestBug(bug);
  }

  /**
   * @param {boolean} dontRefreshView 
   * @return {Promise<boolean>} indicates if practice session is stopped
   */
  async stopPractice(dontRefreshView = false) {
    if (!this.practiceSession) {
      return true;
    }

    const stopped = await this.practiceSession.confirmStop();
    if (!stopped) {
      return false;
    }

    const exited = await this.practiceSession.confirmExit(dontRefreshView);
    return exited;
  }

  /**
   * NOTE: Dev only
   * @param {string} filePath 
   */
  async loadPracticeSessionFromFile(filePath) {
    if (!await this.stopPractice()) {
      return false;
    }

    try {
      const { sessionId, createdAt, bugId } = await PathwaysDataProvider.parseHeader(filePath);
      const bug = this.getOrCreateDefaultProjectList().getBugById(bugId);
      if (!bug) {
        throw new Error(`Cannot find bug of bugId: ${bugId} in log file`);
      }

      if (!this.bdp.getBugProgressByBug(bug)) {
        this.bdp.addBugProgress(bug, BugStatus.Solving, false);
      }

      bug.project.initProject();
      await this.switchToBug(bug);
      this._resetPracticeSession(bug, { createdAt, sessionId, state: PracticeSessionState.Stopped }, true, filePath);
      await this.savePracticeSession();
      await this.bdp.save();
      const lastAction = this.pdp.collections.userActions.getLast();
      emitSessionFinishedEvent(this.practiceSession.state, lastAction.createdAt);
      return true;
    }
    catch (err) {
      logError(`Failed to load from log file ${filePath}:`, err);
      return false;
    }
  }

  _resetPracticeSession(bug, sessionData = EmptyObject, load = false, filePath) {
    // clear applications
    allApplications.clear();

    // create new PracticeSession
    this.practiceSession = new PracticeSession(bug, this, sessionData, filePath);

    // init (+ maybe load) pdp
    this.pdp.init();

    // notify event listeners
    !load && emitPracticeSessionEvent('started', this.practiceSession);
    this._emitter.emit('practiceSessionStateChanged');
  }

  // ########################################
  // PracticeSession: save/load
  // ########################################

  async recoverPracticeSession() {
    const bug = this.getBugByKey(savedPracticeSessionKeyName);
    if (!bug) {
      return;
    }

    const bugProgress = this.bdp.getBugProgressByBug(bug);
    if (!bugProgress) {
      warn(`Can't find bugProgress when starting existing PracticeSession for bug ${bug.id}`);
      return;
    }

    try {
      bug.project.initProject();
      const sessionData = this.externals.storage.get(savedPracticeSessionDataKeyName) || EmptyObject;
      this._resetPracticeSession(bug, sessionData, true);
      this.practiceSession.setupStopwatch();
      this.maybeAskForTestBug(bug);
    }
    catch (err) {
      logError(`Unable to load PracticeSession: ${err.stack}`);
    }
  }

  async savePracticeSession() {
    if (this.practiceSession) {
      const { bug } = this.practiceSession;
      await this.setKeyToBug(savedPracticeSessionKeyName, bug);
      await this.externals.storage.set(savedPracticeSessionDataKeyName, {
        createdAt: this.practiceSession.createdAt,
        sessionId: this.practiceSession.sessionId,
        logFilePath: this.practiceSession.logFilePath,
        state: this.practiceSession.state
      });
    }
    else {
      await this.setKeyToBug(savedPracticeSessionKeyName, undefined);
      await this.externals.storage.set(savedPracticeSessionDataKeyName, undefined);
    }
  }

  // ########################################
  // PracticeSession: util
  // ########################################

  onPracticeSessionStateChanged(cb) {
    return this._emitter.on('practiceSessionStateChanged', cb);
  }

  /**
   * @return {Promise<boolean>}
   */
  async askForStopwatch() {
    // TOTRANSLATE
    const confirmMsg = `This is your first time activate this bug, do you want to start a timer?\n`
      + `[WARN] You will not be able to time this bug once you activate it.`;
    return await this.externals.confirm(confirmMsg);
  }

  async askForSubmit() {
    const confirmString = 'Congratulations!! You have passed all test 🎉🎉🎉\nWould you like to submit the result?';
    const shouldSubmit = await this.externals.confirm(confirmString, false);

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

  async maybeAskForTestBug(bug) {
    try {
      if (!allApplications.getAll().length) {
        // TOTRANSLATE
        const confirmMessage = 'You have not run any test yet, do you want to run it?';
        const result = await this.externals.confirm(confirmMessage, false);
        if (result) {
          await this.switchAndTestBug(bug);
          return true;
        }
      }
      return false;
    }
    catch (err) {
      logError(err);
      return false;
    }
  }

  // ###########################################################################
  // Project Controll
  // ###########################################################################

  /**
   * @param {Bug} bug 
   */
  async resetBug(bug) {
    const confirmMessage = 'This will discard all your changes on this bug. Are you sure?';
    if (!await this.externals.confirm(confirmMessage)) {
      const err = new Error('Action rejected by user');
      err.userCanceled = true;
      throw err;
    }

    // TODO: this reset the project, but the bug might not be the activated bug
    await bug.project.gitResetHard();

    if (this.bdp.getBugProgressByBug(bug)) {
      this.bdp.updateBugProgress(bug, { patch: '' });
      await this.bdp.save();
    }
  }

  /**
   * Apply the newest patch from `BugProgress`
   * @param {Bug} bug
   */
  async applyBugPatch(bug) {
    const patchString = this.bdp.getBugProgressByBug(bug)?.patch;

    if (patchString) {
      const { project } = bug;
      try {
        await project.applyPatchString(patchString);
      }
      catch (err) {
        err.applyFailedFlag = true;
        err.patchString = patchString;
        throw err;
      }
    }
  }

  /**
   * Saves any changes in current active project as patch of bug
   * @param {Bug} bug 
   */
  async saveFileChanges(bug) {
    const patch = await bug.project.getPatchString();
    if (patch) {
      this.bdp.updateBugProgress(bug, { patch });
      await this.bdp.save();
    }
  }

  // ###########################################################################
  // BugRunner interface
  // ###########################################################################

  /**
   * Switch to bug and run the test
   * @param {Bug} bug 
   * @param {Object} inputCfg
   */
  async switchAndTestBug(bug, inputCfg = EmptyObject) {
    await this.switchToBug(bug);
    const result = await this.runTest(bug, inputCfg);
    return result;
  }

  async switchToBug(bug) {
    if (this.runner.isBugActive(bug)) {
      // skip if bug is already activated
      return;
    }

    // if some bug are already activated, save the changes
    const previousBug = this.runner.bug;
    if (previousBug?.project.doesProjectFolderExist()) {
      await this.saveFileChanges(previousBug);
      await previousBug.project.gitResetHard();
    }

    // install things
    await this.runner.activateBug(bug);

    // apply stored patch
    try {
      await this.applyBugPatch(bug);
    } catch (err) {
      if (!err.applyFailedFlag) {
        // logError(err);
        throw err;
      }

      const keepRunning = await this.externals.showMessage.warning(`Failed when applying previous progress of this bug.`, {
        'Show diff in new tab and cancel': async () => {
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

  async runTest(bug, inputCfg) {
    // TODO: make this configurable
    // NOTE2: nolazy is required for proper breakpoints in debug mode
    let {
      debugMode = false,
      dbuxEnabled = true,
      enableSourceMaps = false
    } = inputCfg;

    // WARN: --enable-source-maps makes execution super slow in production mode for some reason
    // NOTE: only supported in Node 12.12+
    const sourceMapsFlag = (enableSourceMaps &&
      (!bug.project.nodeVersion || parseFloat(bug.project.nodeVersion) > 12.12)
    ) ? '--enable-source-maps' : '';

    const nodeArgs = `--stack-trace-limit=100 ${debugMode ? '--nolazy' : ''} ${sourceMapsFlag}`;
    const cfg = {
      debugMode,
      nodeArgs,
      dbuxEnabled,

      // NOTE: if !dbuxEnabled -> we don't actually run dbux at all anymore.
      dbuxArgs: dbuxEnabled ? '--verbose=1' : '--dontInjectDbux',
    };

    const result = await this.runner.testBug(bug, cfg);

    await this.saveTestRunResult(bug, result);

    result?.code && await bug.openInEditor();

    return result;
  }

  async saveTestRunResult(bug, result) {
    // TODO: a better way to find the real application generated by the project
    const patch = await bug.project.getPatchString();
    const apps = allApplications.selection.getAll();

    this.pdp.addTestRun(bug, result?.code, patch, apps);
    this.pdp.addApplications(apps);
    this.bdp.updateBugProgress(bug, { patch });
  }

  async stopRunner() {
    await this.runner.cancel();
  }

  isBusy() {
    return this.runner.isBusy();
  }

  // ########################################
  // BugRunner: event
  // ########################################

  onTestFinished(cb) {
    return this.runner._emitter.on('testFinished', cb);
  }

  // ###########################################################################
  // Project/Bug run status
  // ###########################################################################

  onRunStatusChanged(cb) {
    return this.runner.onStatusChanged(cb);
  }

  onBugStatusChanged(cb) {
    return this._emitter.on('bugStatusChanged', cb);
  }

  // ###########################################################################
  // Progress Log
  // ###########################################################################

  /**
   * NOTE: dev only
   */
  async resetProgress() {
    if (await this.stopPractice()) {
      await this.savePracticeSession();
      await this.bdp.reset();
      await this.runner.deactivateBug();
    }
  }

  async resetLog() {
    if (this.pdp.collections.testRuns.size) {
      debug(`resetPracticeLog: resetting log only`);
      await this.pdp.clearSteps();
    }
    else {
      logError(`resetPracticeLog: no previous results found.`);
      // await this.resetProgress();
    }
  }

  // ###########################################################################
  // Path util
  // ###########################################################################

  getDevPackageRoot() {
    // NOTE: __dirname is actually "..../dbux-code/dist", because of webpack
    return realPathSyncNormalized(path.join(__dirname, '..', '..'));
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
    debug(`getDbuxPath(), relativePath='${relativePath}', getDbuxRoot()='${this.getDbuxRoot()}', config=${JSON.stringify(this.config)}`);
    return path.join(this.getDbuxRoot(), 'node_modules', relativePath);
  }

  getDbuxRoot() {
    if (process.env.DBUX_ROOT) {
      // if we install in dev mode, DBUX_ROOT is set, but we are not in it
      return process.env.DBUX_ROOT;
    }

    // in production mode, we must install dbux separately
    if (!this.config.dependencyRoot) {
      throw new Error(`ProjectsManager missing dependencyRoot: ${JSON.stringify(this.config)}`);
    }
    return this.config.dependencyRoot;
  }

  // ###########################################################################
  // Bug save util
  // ###########################################################################

  /**
   * @param {string} key 
   * @param {Bug} bug NOTE: set to `undefined` to clear the storage
   */
  async setKeyToBug(key, bug) {
    await this.externals.storage.set(key, bug?.id);
  }

  /**
   * @param {string} key 
   * @return {Bug}
   */
  getBugByKey(key) {
    const bugId = this.externals.storage.get(key);

    return this.getOrCreateDefaultProjectList().getBugById(bugId) || null;
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
    return !this.getMissingSharedDependencies().length;
  }

  getMissingSharedDependencies(deps) {
    deps = this._getAllDependenciesToCheck(deps);
    return deps.filter(dep => !this.isDependencyInstalled(dep));
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

      const command = [
        `npm install --only=prod`,
        ...deps.length && [`npm i ${deps.join(' ')}`] || EmptyArray
      ];

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
  // Projects manager utilities
  // ###########################################################################

  async execInTerminal(cwd, command, options) {
    try {
      this._terminalWrapper = this.externals.TerminalWrapper.execInTerminal(cwd, command, options);
      return await this._terminalWrapper.waitForResult();
    }
    finally {
      this._terminalWrapper?.cancel();
      this._terminalWrapper = null;
    }
  }

  /**
   * @param {Object} result 
   * @param {number} result.code
   * 
   * @return {BugStatus}
   */
  getResultStatus(result) {
    return (!result || result.code) ? BugStatus.Attempted : BugStatus.Solved;
  }

  // ###########################################################################
  // Temporary backend stuff
  // ###########################################################################

  async _uploadLog() {
    const translator = getTranslationScope('uploadLog');

    let logDirectory = this.externals.resources.getLogsDirectory();
    let allLogFiles = fs.readdirSync(logDirectory);
    let logFiles = allLogFiles.filter(fileName => !fileName.startsWith('uploaded__'));
    if (logFiles.length === 0) {
      this.externals.showMessage.info(translator('nothing'));
      return;
    }

    let answerButtons = {
      [translator('uploadOne', { count: logFiles.length })]() {
        return [
          logFiles.map(filename => ({
            filename,
            time: fs.statSync(path.join(logDirectory, filename)).mtimeMs,
          })).reduce((result, file) => result.time > file.time ? result : file).filename,
        ];
      }
    };

    if (logFiles.length > 1) {
      answerButtons[translator('uploadAll')] = function () { return logFiles; };
    }

    logFiles = await this.externals.showMessage.info(translator('askForUpload', { count: logFiles.length }), answerButtons, { modal: true });
    if (!logFiles) {
      this.externals.showMessage.info(translator('showCanceled'));
      return;
    }

    let githubSession = await this.externals.interactiveGithubLogin();
    let githubToken = githubSession.accessToken;

    let promises = logFiles.map(async (logFile) => {
      await upload(githubToken, path.join(logDirectory, logFile));

      let newFilename = `uploaded__${logFile}`;
      fs.renameSync(path.join(logDirectory, logFile), path.join(logDirectory, newFilename));
    });

    this.externals.showMessage.info(translator('uploading'));
    await Promise.all(promises);
    this.externals.showMessage.info(translator('done'));
  }

  async uploadLog() {
    const translator = getTranslationScope('uploadLog');

    if (this._uploadPromise) {
      this.externals.showMessage.info(translator('alreadyUploading'));
      return;
    }

    try {
      await (this._uploadPromise = this._uploadLog());
    }
    catch (err) {
      logError(`Error when file uploading: ${err.stack}`);
    }
    finally {
      this._uploadPromise = null;
    }
  }

  async showBugLog(bug) {
    await this.getAndInitBackend();
    await this._backend.login();
    // Rules not edit yet, so needs login to read

    let collectionRef = this._backend.db.collection('userEvents');
    let result = await collectionRef.get();
    let allData = [];
    result.forEach(doc => {
      allData.push({
        id: doc.id,
        data: doc.data(),
      });
    });
    this.externals.editor.showTextInNewFile('all.json', JSON.stringify(allData, null, 2));
  }

  async deleteUserEvents() {
    await this.getAndInitBackend();
    await this._backend.login();
    // Rules not edit yet, so needs login to read

    let collectionRef = this._backend.db.collection('userEvents');
    let result = await collectionRef.get();
    await result.forEach(async (doc) => {
      await doc.ref.delete();
      debug('deleted', doc.id);
    });
  }
}