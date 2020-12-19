import path from 'path';
import fs from 'fs';
import sh from 'shelljs';
import NanoEvents from 'nanoevents';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import { readPackageJson } from '@dbux/cli/lib/package-util';
import projectRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import BugRunner from './projectLib/BugRunner';
import PracticeSession from './practiceSession/PracticeSession';
import RunStatus from './projectLib/RunStatus';
import BugStatus from './dataLib/BugStatus';
import BackendController from './backend/BackendController';
import PathwaysDataProvider from './dataLib/PathwaysDataProvider';
import PracticeSessionState from './practiceSession/PracticeSessionState';
import { initUserEvent, emitSessionFinishedEvent, emitPracticeSessionEvent, onUserEvent, emitUserEvent } from './userEvents';
import BugDataProvider from './dataLib/BugDataProvider';
import initLang, { getTranslationScope } from './lang';
import upload from './fileUpload';

const logger = newLogger('PracticeManager');
// eslint-disable-next-line no-unused-vars
const { debug, log, warn, error: logError } = logger;

const depsStorageKey = 'PracticeManager.deps';
const activatedBugKeyName = 'dbux.dbux-projects.activatedBug';
const savedPracticeSessionKeyName = 'dbux.dbux-projects.currentlyPracticingBug';
const savedPracticeSessionDataKeyName = 'dbux.dbux-projects.practiceSessionCreatedAt';

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

  get pdp() {
    return this.pathwayDataProvider;
  }

  get bdp() {
    return this.bugDataProvider;
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

  // ###########################################################################
  // PracticeSession
  // ###########################################################################

  async startPractice(bug) {
    if (this.practiceSession) {
      await this.externals.alert(`You are currently practicing ${bug.id}`, true);
      return;
    }

    let bugProgress = this.bdp.getBugProgressByBug(bug);

    if (!bugProgress) {
      const stopwatchEnabled = await this.askForStopwatch();
      bugProgress = this.bdp.addBugProgress(bug, BugStatus.Solving, stopwatchEnabled);

      this._resetPracticeSession(bug);

      // install and activate bug (don't run it)
      // await this.activateBug(bug);
      await this.switchToBug(bug);
      this.bdp.updateBugProgress(bug, { startedAt: Date.now() });
    }
    else {
      this._resetPracticeSession(bug);
    }

    await this.switchToBug(bug);
    this.practiceSession.setupStopwatch();
    await this.savePracticeSession();
    await this.bdp.save();
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

      await this.switchToBug(bug);
      
      if (!this.bdp.getBugProgressByBug(bug)) {
        this.bdp.addBugProgress(bug, BugStatus.Solving, false);
      }
      this._resetPracticeSession(bug, { createdAt, sessionId, state: PracticeSessionState.Stopped }, true, filePath);
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
      const sessionData = this.externals.storage.get(savedPracticeSessionDataKeyName) || EmptyObject;
      this._resetPracticeSession(bug, sessionData, true);
      this.practiceSession.setupStopwatch();
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
    const confirmMsg = `This is your first time activate this bug, do you want to start a timer?\n`
      + `[WARN] You will not be able to time this bug once you activate it.`;
    return await this.externals.confirm(confirmMsg, true);
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

  // ###########################################################################
  // Project Controll
  // ###########################################################################

  /**
   * @param {Bug} bug 
   */
  async resetBug(bug) {
    try {
      await bug.project.gitResetHard(true, 'This will discard all your changes on this bug.');
    }
    catch (err) {
      if (err.userCanceled) {
        return;
      }
      else {
        throw err;
      }
    }
    this.bdp.updateBugProgress(bug, { patch: '' });
    await this.bdp.save();
  }

  /**
   * Apply the newest patch in testRuns
   * @param {Bug} bug
   */
  async applyNewBugPatch(bug) {
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
   * Install and run a bug, then save testRun after result
   * NOTE: Only used internally to manage practice flow
   * @param {Bug} bug 
   * @param {Object} inputCfg
   */
  async activateBug(bug, inputCfg = EmptyObject) {
    await this.switchToBug(bug);
    const result = await this.runTest(bug, inputCfg);
    return result;
  }

  async switchToBug(bug) {
    const previousBug = this.getPreviousBug();

    // if some bug are already activated, save the changes
    if (bug !== previousBug) {
      if (previousBug?.project.isProjectFolderExists()) {
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
        if (!err.applyFailedFlag) {
          logError(err);
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

    const patch = await bug.project.getPatchString();
    const apps = allApplications.selection.getAll();
    this.pdp.addTestRun(bug, result?.code, patch, apps);
    this.pdp.addApplications(apps);
    this.bdp.updateBugProgress(bug, { patch });

    result?.code && await bug.openInEditor();

    return result;
  }

  async stopRunner() {
    await this.runner.cancel();
  }

  // ########################################
  // BugRunner: event
  // ########################################

  onTestFinished(cb) {
    return this.runner._emitter.on('testFinished', cb);
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

  /**
   * NOTE: dev only
   */
  async resetProgress() {
    await this.stopPractice();
    await this.savePracticeSession();
    await this.bdp.reset();
    // await this.pdp.clear();
    await this.updateActivatingBug(undefined);
  }

  // ###########################################################################
  // Path util
  // ###########################################################################

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
  // Bug save util
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
  // Projects manager utilities
  // ###########################################################################

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

  /**
   * @param {Object} result 
   * @param {number} result.code
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