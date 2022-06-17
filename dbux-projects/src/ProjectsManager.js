import path from 'path';
import fs from 'fs';
import sh from 'shelljs';
import NanoEvents from 'nanoevents';
import merge from 'lodash/merge';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import { pathJoin, pathResolve, realPathSyncNormalized } from '@dbux/common-node/src/util/pathUtil';
import { getFileSizeSync } from '@dbux/common-node/src/util/fileUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { readPackageJson } from '@dbux/cli/lib/package-util';
import { requireUncached } from '@dbux/common-node/src/util/requireUtil';
import projectRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import ExerciseRunner from './projectLib/ExerciseRunner';
import PracticeSession from './practiceSession/PracticeSession';
import ExerciseStatus from './dataLib/ExerciseStatus';
import BackendController from './backend/BackendController';
import PathwaysDataProvider from './dataLib/PathwaysDataProvider';
import PracticeSessionState from './practiceSession/PracticeSessionState';
import { emitPracticeSessionEvent, onUserEvent, emitUserEvent } from './userEvents';
import ExerciseDataProvider from './dataLib/ExerciseDataProvider';
import initLang, { getTranslationScope } from './lang';
import upload from './fileUpload';
import { checkSystem, getDefaultRequirement } from './checkSystem';
import Chapter from './projectLib/Chapter';
import { initProcess } from './util/Process';
import PathwaysSession from './practiceSession/PathwaysSession';

const logger = newLogger('PracticeManager');
// eslint-disable-next-line no-unused-vars
const { debug, log, warn, error: logError } = logger;

const depsStorageKey = 'PracticeManager.deps';
const savedPracticeSessionKey = 'dbux.dbux-projects.savedPracticeSession';

/** @typedef {import('dbux-code/src/terminal/TerminalWrapper').default} TerminalWrapper */
/** @typedef {import('@dbux/data/src/applications/Application').default} Application */
/** @typedef {import('./projectLib/Project').default} Project */
/** @typedef {import('./projectLib/Exercise').default} Exercise */
/** @typedef {import('./externals/Storage').default} ExternalStorage */

function canIgnoreDependency(name) {
  if (process.env.NODE_ENV === 'development' && name.startsWith('@dbux/')) {
    // NOTE: in development mode, we have @dbux dependencies (and their dependencies) all linked up to the monoroot folder anyway
    // NOTE: we need to short-circuit this for when we run the packaged extension in dev mode
    return true;
  }
  return false;
}

/**
 * @extends {DbuxManager}
 */
export default class ProjectsManager {
  /**
   * @type {PracticeSession}
   */
  practiceSession;
  /**
   * @type {ExerciseRunner}
   */
  runner;
  /**
   * @type {BackendController}
   */
  _backend;

  /**
   * @type {Map.<string, Exercise>}
   */
  _allExercisesById;

  /**
   * @type {Map.<string, Exercise>}
   */
  _allExercisesByName;

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

    initProcess({
      shell: this.paths.bash
    });

    this.practiceSession = null;
    this.runner = new ExerciseRunner(this);
    this.runner.start();
    this._emitter = new NanoEvents();

    this._backend = new BackendController(this);

    this.exerciseDataProvider = new ExerciseDataProvider(this);

    // Note: we need this to check if any dependencies are missing (not to install them)
    this._pkg = readPackageJson(this.config.dependencyRoot);
    this._sharedDependencyNamesToCheck = [
      ...this._sharedDependencyNames,
      ...Object.entries(this._pkg.dependencies || EmptyObject).
        map(([name, version]) => `${name}@${version}`)
    ];

    this.registerPDPEventListeners();

    // NOTE: This is for public API. To emit event in dbux-projects, register event in dbux-projects/src/userEvents.js and import it directly 
    // this.onUserEvent = onUserEvent;
    this.emitUserEvent = emitUserEvent;
  }

  async init() {
    await initLang(this.config.dbuxLanguage);

    await this.bdp.init();

    // build projects + chapters
    this.loadProjectList();
    this.reloadExercises();

    // ensure log folder exists
    const logFolderPath = this.externals.resources.getLogsDirectory();
    if (!fs.existsSync(logFolderPath)) {
      fs.mkdirSync(logFolderPath, { recursive: true });
    }
  }

  /**
   * Called internally when a new Application was just created.
   * 
   * @param {Application} app 
   */
  _handleNewApplication(app) {
    const { activeExperiment } = this;
    if (activeExperiment && app.entryPointPath?.startsWith(activeExperiment.project.projectPath)) {
      app.projectName = app.projectName || activeExperiment.project.name;
      app.experimentId = app.experimentId || activeExperiment.id;
    }
  }

  // ###########################################################################
  // getters
  // ###########################################################################
  get paths() {
    return this.externals.paths;
  }

  get interactiveMode() {
    return true;
  }

  get activeProject() {
    return this.runner.project;
  }

  get activeExercise() {
    return this.runner.exercise;
  }

  get activeExperiment() {
    return this.runner.exercise;
  }

  get bdp() {
    return this.exerciseDataProvider;
  }

  get research() {
    return this.externals.getCurrentResearch();
  }

  /**
   * @return {ProjectList}
   */
  get projects() {
    if (!this._projects) {
      this.loadProjectList();
    }
    return this._projects;
  }

  async getAndInitBackend() {
    await this._backend.init();
    return this._backend;
  }

  getAssetPath(...segments) {
    if (path.isAbsolute(segments[0])) {
      // absolute path
      return realPathSyncNormalized(pathResolve(...segments));
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        return this.getDevAssetPath(...segments);
      }
      else {
        return this.externals.resources.getResourcePath('dist', 'projects', ...segments);
      }
    }
  }

  /** ###########################################################################
   * exercise management
   * ##########################################################################*/

  /**
   * Retrieves all case study objects, 
   * sorted by name (in descending order).
   * @return {ProjectList}
   */
  loadProjectList() {
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

    this._projects = list;

    return this._projects;
  }

  reloadChapterList(chapterListName = 'list1') {
    const chapters = [];
    try {
      // future-work: allow for loading/choosing any chapter list
      const chapterListFile = this.getAssetPath('chapterLists', `${chapterListName}.js`);
      // const chapterRegistry = JSON.parse(fs.readFileSync(chapterListFile, 'utf-8'));
      const chapterRegistry = requireUncached(chapterListFile);
      for (const chapterConfig of chapterRegistry) {
        const { id, name, exercises: exerciseIdOrNames, ...otherCfg } = chapterConfig;
        const exercises = exerciseIdOrNames.map(idOrName => {
          const exercise = this.getExerciseByIdOrName(idOrName);
          if (!exercise) {
            warn(
              `Cannot find exercise of id or name:${idOrName} in chapter#${id} (${name}). ` +
              `Make sure exerciseIds in "exerciseList.json" are correct.`
            );
            return null;
          }
          return exercise;
        }).filter(Boolean);
        const chapter = new Chapter(this, id, name, exercises, otherCfg);
        chapters.push(chapter);
      }
      return chapters;
    }
    catch (err) {
      logError(`Cannot load chapters: ${err.stack}`);
      return chapters;
    }
  }

  /**
   * Reload exercises for every project, also reload chapters.
   */
  reloadExercises() {
    this._allExercisesById = new Map();
    this._allExercisesByName = new Map();
    for (const project of this.projects) {
      project.reloadExercises();
    }
    this.chapters = this.reloadChapterList();
  }

  registerNewExercise(exercise) {
    this._allExercisesById.set(exercise.id, exercise);
    if (exercise.uniqueName) {
      this._allExercisesByName.set(exercise.uniqueName, exercise);
    }
  }

  getExerciseById(id) {
    return this._allExercisesById.get(id);
  }

  getExerciseByIdOrName(exerciseIdOrUniqueName) {
    return this._allExercisesById.get(exerciseIdOrUniqueName) ||
      this._allExercisesByName.get(exerciseIdOrUniqueName);
  }

  // ###########################################################################
  // PracticeSession: start/stop/exit
  // ###########################################################################

  /**
   * Start a brand new session
   * @param {Exercise} [exercise]
   * @returns {Promise<PathwaysSession|PracticeSession|null>}
   */
  async startPractice(exercise) {
    if (!await this.exitPracticeSession()) {
      return null;
    }

    const requirements = merge({}, getDefaultRequirement(true), this._systemRequirement);
    await checkSystem(this, requirements, false);

    if (exercise) {
      // start a `PracticeSession`
      const exerciseProgress = this.bdp.getExerciseProgress(exercise.id);
      if (!exerciseProgress) {
        const stopwatchEnabled = await this.askForStopwatch(exercise);
        if (stopwatchEnabled === null) {
          // user canceled
          return null;
        }
        this.bdp.addExerciseProgress(exercise, stopwatchEnabled, { startedAt: Date.now() });
        await this.bdp.save();
      }

      await this.switchToExercise(exercise);
    }

    allApplications.clear();

    // TODO: also fix askForRecoverPracticeSession + recoverPracticeSession
    //  -> ultimately use research data for practice session data, if available (NOTE: the format is slightly different)
    //  -> if not available, should not store all application data; only that relevant for the practice session.

    await this._loadSession(exercise);

    if (exercise) {
      this.practiceSession.setupStopwatch();
      await this.practiceSession.testExercise();
    }
    return this.practiceSession;
  }

  /**
   * Ask for `stop` practice session but not quit
   * @return {Promise<boolean>} indicates if practice session is stopped
   */
  async stopPracticeSession() {
    if (!this.practiceSession) {
      return true;
    }

    const stopped = await this.practiceSession.confirmStop();
    if (!stopped) {
      return false;
    }

    return stopped;
  }

  /**
   * Ask for `stop` and `exit` practice session.
   * @return {Promise<boolean>} indicates if practice session is exited
   */
  async exitPracticeSession() {
    if (!this.practiceSession) {
      return true;
    }

    const stopped = await this.practiceSession.confirmStop();
    if (!stopped) {
      return false;
    }

    const exited = await this.practiceSession.confirmExit();
    if (exited) {
      this.practiceSession = null;
    }
    await this.saveSession();
    this._notifyPracticeSessionStateChanged();
    return exited;
  }

  /**
   * NOTE: Dev only
   * @param {string} logFilePath 
   */
  async loadPracticeSessionFromFile(logFilePath) {
    if (!await this.exitPracticeSession()) {
      return false;
    }

    try {
      const { sessionId, createdAt, exerciseId } = await PathwaysDataProvider.parseHeader(logFilePath);
      const exercise = this.getExerciseById(exerciseId);
      if (exercise) {
        if (!this.bdp.getExerciseProgress(exercise.id)) {
          this.bdp.addExerciseProgress(exercise, false);
        }
        await this.bdp.save();
        await this.switchToExercise(exercise);
      }
      allApplications.clear();    // clear applications

      await this._loadSession(exercise, { createdAt, sessionId, logFilePath, state: PracticeSessionState.Stopped }, false);

      return true;
    }
    catch (err) {
      logError(`Failed to load from log file ${logFilePath}:`, err);
      return false;
    }
  }

  /** ###########################################################################
   * PracticeSession: save/load
   * ##########################################################################*/

  async tryRecoverPracticeSession() {
    let savedSessionData = this.externals.storage.get(savedPracticeSessionKey);
    if (!savedSessionData) {
      return false;
    }

    const shouldRecover = await this.askForRecoverPracticeSession(savedSessionData);
    if (!shouldRecover) {
      return false;
    }

    try {
      const { exerciseId } = savedSessionData;
      const exercise = this.getExerciseById(exerciseId);
      await this._loadSession(exercise, savedSessionData, false);
      if (exercise) {
        await this.switchToExercise(exercise);
        this.practiceSession.setupStopwatch();
      }
      return true;
    }
    catch (err) {
      logError(`Unable to load PracticeSession:`, err);
      return false;
    }
  }

  async loadResearchSession(exerciseId) {
    // const researchSize = exerciseId && this.research.getAppFileSize(exerciseId);
    const exercise = this.getExerciseById(exerciseId);
    if (!this.bdp.getExerciseProgress(exerciseId)) {
      this.bdp.addExerciseProgress(exercise, false);
    }
    await this.bdp.save();
    this.research.importResearchAppData(exerciseId);
    await this._loadSession(exercise, EmptyObject, false);
  }

  /**
   * NOTE: We save sessionId and other data in `ExternalStorage`, and use it to find the corresponding log file.
   * @param {PathwaysSession} session set to `null` to clear saved data.
   */
  async saveSession(session = this.practiceSession) {
    if (session) {
      const sessionData = session.serialize();
      const applicationUUIDs = session.pdp.collections.applications.getAllActual().map(app => app.uuid);
      await this.externals.storage.set(savedPracticeSessionKey, {
        ...sessionData,
        applicationUUIDs,
      });
    }
    else {
      await this.externals.storage.set(savedPracticeSessionKey, undefined);
    }
  }

  /**
   * @param {PracticeSessionData} savedSessionData 
   * @param {Exercise} exercise 
   * @param {boolean} isNew 
   * @returns 
   */
  async _loadSession(exercise = null, savedSessionData = {}, isNew = true) {
    if (exercise) {
      const sessionData = { exerciseId: exercise.id };
      Object.assign(sessionData, savedSessionData);
      this.practiceSession = PracticeSession.from(this, sessionData);
    }
    else {
      this.practiceSession = PathwaysSession.from(this, savedSessionData);
    }

    await this.practiceSession.init();

    isNew && emitPracticeSessionEvent('started', this.practiceSession);
    this._notifyPracticeSessionStateChanged();
    await this.saveSession();
  }

  async askForRecoverPracticeSession(sessionData = EmptyObject) {
    function sizeMessage(prefix, size) {
      if (!size) {
        return '';
      }
      size = (Math.round(size) / 1000).toFixed(2).toLocaleString('en-us');
      return `${prefix} log file is ${size}kb.\n`;
    }

    try {
      const { logFilePath, applicationUUIDs } = sessionData;
      const practiceSize = applicationUUIDs?.reduce((currentSize, uuid) => {
        const appFilePath = this.getApplicationFilePath(uuid);
        return currentSize + getFileSizeSync(appFilePath);
      }, getFileSizeSync(logFilePath)) || 0;

      if (!practiceSize) {
        return false;
      }

      debug(`practiceSize =`, practiceSize);

      const { exerciseId } = sessionData;
      const exerciseLabel = exerciseId ? ` for ${exerciseId}` : '';

      // eslint-disable-next-line max-len
      const confirmMessage = `Dbux has found previous session${exerciseLabel}":\n` +
        sizeMessage('Practice', practiceSize) +
        `\nDo you want to load the previous session?`;
      const buttons = {
        [`Load Practice Session`]: () => true,
        [`Ignore (don't ask again)`]: async () => {
          // saved session should be discarded and the user should not be asked again
          await this.saveSession(null);
          return false;
        },
        [`Delete Practice Session`]: async () => {
          // TODO: first CONFIRM! then delete research file
          await this.saveSession(null);
          // fs.rmSync(appFilePath);
          // TODO: delete all application- and session-related files of a single session here
          this.externals.showMessage.warn(`File deletion is not implemented yet :(`);
          return false;
        }
      };
      const cancelCallback = () => false;
      return await this.externals.showMessage.info(confirmMessage, buttons, { modal: true }, cancelCallback);
    }
    catch (err) {
      logError(`Could not recover practice session`, err);
      return false;
    }
  }

  /**
   * TODO: move all project-related files to a project-related directory
   */
  getApplicationFilePath(uuid) {
    return pathResolve(this.externals.resources.getLogsDirectory(), `${uuid}.dbuxapp`);
  }

  getPathwaysLogFilePath(sessionId) {
    return pathResolve(this.externals.resources.getLogsDirectory(), `${sessionId}.dbuxlog`);
  }

  getExerciseIndexFilePath(exercise) {
    return pathResolve(this.externals.resources.getLogsDirectory(), `${exercise.id}.index`);
  }

  /** ###########################################################################
   * PrcaticeSession: events
   * ##########################################################################*/

  onPracticeSessionStateChanged(cb) {
    return this._emitter.on('practiceSessionStateChanged', cb);
  }

  _notifyPracticeSessionStateChanged() {
    this._emitter.emit('practiceSessionStateChanged');
  }

  // ########################################
  // PracticeSession: util
  // ########################################

  /**
   * @param {Exercise} exercise
   * @return {Promise<boolean>}
   */
  async askForStopwatch(exercise) {
    if (!exercise.isSolvable) {
      return false;
    }
    // TOTRANSLATE
    const confirmMsg = `This is your first time activate this exercise, do you want to start a timer?\n`
      + `[WARN] You will not be able to time this exercise once you activate it.`;
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

  async maybeAskForTestExercise() {
    try {
      if (!allApplications.getAll().length) {
        // TOTRANSLATE
        const confirmMessage = 'You have not run any test yet, do you want to run it?';
        const result = await this.externals.confirm(confirmMessage, false);
        if (result) {
          await this.practiceSession.testExercise();
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

  /** ###########################################################################
   * Pathways
   *  #########################################################################*/

  registerPDPEventListeners() {
    onUserEvent((actionData) => {
      if (this.practiceSession && !this.practiceSession.isStopped()) {
        this.practiceSession.pdp.addNewUserAction(actionData);
      }
    });

    allApplications.selection.onApplicationsChanged((apps) => {
      if (this.practiceSession && !this.practiceSession.isStopped()) {
        this.practiceSession.maybeRecordApplications(apps);
      }
    });
  }

  // ###########################################################################
  // ProjectControl
  // ###########################################################################

  /**
   * @param {Exercise} exercise 
   */
  async resetExercise(exercise) {
    const confirmMessage = 'This will discard all your changes on this exercise. Are you sure?';
    if (!await this.externals.confirm(confirmMessage)) {
      const err = new Error('Action rejected by user');
      err.userCanceled = true;
      throw err;
    }

    const { project } = exercise;
    await project.resetExercise(exercise);

    // await project.gitResetHard();

    if (this.bdp.getExerciseProgress(exercise.id)) {
      this.bdp.updateExerciseProgress(exercise, { patch: '' });
      await this.bdp.save();
    }
  }

  /**
   * Apply the newest patch from `ExerciseProgress`
   * @param {Exercise} exercise
   */
  async applyUserPatch(exercise) {
    const patchString = this.bdp.getExerciseProgress(exercise.id)?.patch;

    if (patchString) {
      const { project } = exercise;
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
   * Saves any changes of given bug
   * @param {Exercise} exercise 
   */
  async saveFileChanges(exercise) {
    const patch = await exercise.project.getPatchString();
    if (patch) {
      this.bdp.updateExerciseProgress(exercise, { patch });
      await this.bdp.save();
    }
  }

  // ###########################################################################
  // BugRunner interface
  // ###########################################################################

  /**
   * Switch to bug and run the test
   * @param {Exercise} exercise 
   * @param {Object} inputCfg
   */
  async switchAndTestBug(exercise, inputCfg) {
    await this.switchToExercise(exercise);
    const result = await this.runTest(exercise, inputCfg);
    return result;
  }

  /**
   * The main function for bug switching. Handling user patches and git tag checkout.
   * @param {Exercise} exercise 
   */
  async switchToExercise(exercise) {
    if (this.runner.isBugActive(exercise)) {
      // skip if bug is already activated
      return;
    }

    // /**
    //  * close all files before applying changes
    //  * TODO: only close relative files, currently lack of API support.
    //  * @see https://github.com/microsoft/vscode/issues/15178#issuecomment-909462369 proposed `Tab` API
    //  * @see https://code.visualstudio.com/api/references/vscode-api#TextEditor `TextEditor.hide` deprecated
    //  */
    // await this.externals.closeAllEditors();

    // save changes in the project
    const { project } = exercise;
    const previousExercise = await project.getCurrentBugFromTag();
    if (previousExercise) {
      await this.saveFileChanges(previousExercise);
    }
    if (project.doesProjectFolderExist() && await project.isGitInitialized()) {
      await project.gitResetHard();
    }

    // install things
    await this.runner.activateExercise(exercise);

    // apply stored patch
    try {
      await this.applyUserPatch(exercise);
    } catch (err) {
      if (!err.applyFailedFlag) {
        // logError(err);
        throw err;
      }

      const keepRunning = await this.externals.showMessage.warn(`Failed when applying previous progress of this exercise.`, {
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

  /**
   * TODO: move to practice session
   * @param {Exercise} exercise 
   * @param {object} inputCfg Is currently brought in from `projectViewsController`.
   */
  async runTest(exercise, inputCfg = {}) {
    // fix defaults
    if (!('debugMode' in inputCfg)) {
      inputCfg.debugMode = false;
    }
    if (!('dbuxEnabled' in inputCfg)) {
      inputCfg.dbuxEnabled = true;
    }

    let {
      debugMode,
      dbuxEnabled,
      enableSourceMaps = false
    } = inputCfg;

    if (!exercise.project.checkRunMode(inputCfg)) {
      return undefined;
    }

    // WARN: --enable-source-maps makes execution super slow in production mode for some reason
    // NOTE: only supported in Node 12.12+
    const sourceMapsFlag = (enableSourceMaps &&
      (!exercise.project.nodeVersion || parseFloat(exercise.project.nodeVersion) > 12.12)
    ) ?
      '--enable-source-maps' : // NOTE: `enable-source-maps` is extremely slow on Node < 16
      '';

    // NOTE: `nolazy` is required for proper breakpoints in debug mode
    const nodeArgs = `--stack-trace-limit=100 ${debugMode ? '--nolazy' : ''} ${sourceMapsFlag}`;
    const cfg = {
      debugMode,
      nodeArgs,
      dbuxEnabled,

      // NOTE: if !dbuxEnabled -> we don't actually run dbux at all anymore.
      // TODO: make cache configurable
      // TODO: tie `enableSourceMaps` to `sourceMaps` setting in `buildBabelOptions`
      dbuxArgs: dbuxEnabled ? `--verbose=1 --cache --sourceRoot=${this.getDefaultSourceRoot()}` : '--dontInjectDbux',
    };

    const result = await this.runner.testExercise(exercise, cfg);

    await this.practiceSession?.saveTestRunResult?.(exercise, result);

    result?.code && await exercise.openInEditor();

    return result;
  }

  async stopRunner() {
    await this.runner.cancel();
  }

  isBusy() {
    return this.runner.isBusy();
  }

  /** ########################################
   * {@link ExerciseRunner}: event
   * #######################################*/

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
    if (await this.exitPracticeSession()) {
      await this.saveSession();
      this.bdp.reset();
      await this.bdp.save();
      await this.runner.deactivateExercise();
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

  getDevAssetPath(...segments) {
    return pathResolve(this.getDevPackageRoot(), `dbux-projects/assets`, ...segments);
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
    return pathJoin(this.getDbuxRoot(), 'node_modules', relativePath);
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
   * @param {Exercise} exercise NOTE: set to `undefined` to clear the storage
   */
  async setKeyToExercise(key, exercise) {
    await this.externals.storage.set(key, exercise?.id);
  }

  /**
   * @param {string} key 
   * @return {Exercise}
   */
  getExerciseByKey(key) {
    const id = this.externals.storage.get(key);

    return this.getExerciseById(id) || null;
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
    // warn('isDependencyInstalled', target, target);

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
    while (this._installPromise) {
      await this._installPromise;
    }

    try {
      await (this._installPromise = this._doInstallModules(deps));
    }
    finally {
      this._installPromise = null;
    }
  }

  async _doInstallModules(deps) {
    const { dependencyRoot } = this.config;
    // const execOptions = {
    //   processOptions: {
    //     cwd: dependencyRoot
    //   }
    // };
    // if (!sh.test('-f', rootPackageJson)) {
    //   // make sure, we have a local `package.json`
    //   await this.runner._exec('${npm} init -y', logger, execOptions);
    // }
    if (this.areDependenciesInstalled(deps)) {
      // already done!
      return;
    }

    // delete previously installed node_modules
    // NOTE: if we don't do it, we (sometimes randomly) bump against https://github.com/npm/npm/issues/13528#issuecomment-380201967
    // await rm('-rf', path.join(projectsRoot, 'node_modules'));

    // debug(`Verifying NPM cache. This might (or might not) take a while...`);
    // await this.runner._exec('${npm} cache verify', logger, execOptions);

    // this.externals.showMessage.info(`Installing dependencies: "${deps.join(', ')}" This might (or might not) take a while...`);

    const { npm } = this.paths.inShell;

    // TODO: fix only=prod
    // const flags = ' --only=prod';

    const flags = '';
    const command = [
      `${npm} i`,
      ...deps.length && [`${npm} i${flags} ${deps.join(' ')}`] || EmptyArray
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
    // }
  }

  // ###########################################################################
  // Projects manager utilities
  // ###########################################################################

  async execInTerminal(cwd, command, runCfg) {
    try {
      this._terminalWrapper = this.externals.TerminalWrapper.execInTerminal(cwd, command, runCfg);
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
    return (!result || result.code) ? ExerciseStatus.Attempted : ExerciseStatus.Solved;
  }

  getDefaultSourceRoot() {
    return this.getDbuxRoot();
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

  async showExerciseLog(bug) {
    throw new Error(`The "Exercise Log" feature is temporarily disabled.`);

    // await this.getAndInitBackend();
    // await this._backend.login();
    // // Rules not edit yet, so needs login to read

    // let collectionRef = this._backend.db.collection('userEvents');
    // let result = await collectionRef.get();
    // let allData = [];
    // result.forEach(doc => {
    //   allData.push({
    //     id: doc.id,
    //     data: doc.data(),
    //   });
    // });
    // this.externals.editor.showTextInNewFile('all.json', JSON.stringify(allData, null, 2));
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