import NanoEvents from 'nanoevents';
import path from 'path';
import sh from 'shelljs';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import toString from 'serialize-javascript';
import SerialTaskQueue from '@dbux/common/src/util/queue/SerialTaskQueue';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import allApplications from '@dbux/data/src/applications/allApplications';
import { pathNormalizedForce } from '@dbux/common-node/src/util/pathUtil';
import Process from '../util/Process';
import BugRunnerStatus, { isStatusRunningType } from './RunStatus';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */
/** @typedef {import('./Exercise').default} Exercise */
/** @typedef {import('./Project').default} Project */

// const Verbose = true;
const Verbose = false;
const activatedBugKeyName = 'dbux.dbux-projects.activatedBug';

export default class ExerciseRunner {
  /**
   * @type {ProjectsManager}
   */
  manager;
  /**
   * @type {SerialTaskQueue}
   */
  _queue;
  /**
   * @type {Project}
   */
  _project;
  /**
   * @type {Exercise}
   */
  _exercise;

  debugPort = 9853;

  constructor(manager) {
    this.manager = manager;
    this.status = BugRunnerStatus.None;
    this._ownLogger = newLogger('BugRunner');
    this._emitter = new NanoEvents();

    // NOTE: We use git tags instead of externalStorage saves for safety 
    // this._exercise = this.getSavedActivatedBug();
    this._exercise = null;
  }

  get logger() {
    return this.project?.logger || this._ownLogger;
  }

  get exercise() {
    return this._exercise;
  }

  get project() {
    return this.exercise?.project || null;
  }

  /**
   * Initializes things and creates new task queue.
   */
  start() {
    if (this._queue) {
      throw new Error('already running');
    }

    this.createMainFolder();

    this._queue = new SerialTaskQueue('BugRunnerQueue');

    // TODO: synchronized methods deadlock when they call each other
    // this._queue.synchronizedMethods(this, //this._wrapSynchronized,
    //   'activateProject',
    //   'activateBug',
    //   'testBug',
    //   // 'exec'
    // );
  }

  createMainFolder() {
    // make sure, `projectsRoot` exists
    const { projectsRoot } = this.manager.config;
    sh.mkdir('-p', projectsRoot);
  }

  // _wrapSynchronized(f) {
  //   return () => {

  //   };
  // }

  // ###########################################################################
  // public getters
  // ###########################################################################

  isBusy() {
    // return this._queue.isBusy() || this._process || this.bug;
    return BugRunnerStatus.is.Busy(this.status);
  }

  isRunning() {
    return isStatusRunningType(this.status);
  }

  isProjectActive(project) {
    return this.project === project;
  }

  isBugActive(bug) {
    return this.exercise === bug;
  }

  // ###########################################################################
  // activation methods
  // ###########################################################################

  // async _runOnProject(cb, ...args) {
  //   const project = this.project;
  //   project._runner = this;
  //   try {
  //     return cb.apply(project, ...args);
  //   }
  //   finally {
  //     project._runner = null;
  //   }
  // }

  /**
   * Clone and install the project
   * @param {Project} project 
   */
  async installProject(project) {
    if (this.isProjectActive(project)) {
      return;
    }

    // init
    project.initProject();

    await project.checkSystemRequirement();

    await project.installProject();
  }

  /**
   * Enqueue a bunch of callbacks into the queue.
   */
  async _enqueue(...cbs) {
    return await this._queue.enqueue(...cbs);
  }

  /**
   * WARNING: Should only be called by `switchToExercise`.
   * 
   * @param {Exercise} exercise 
   */
  async activateExercise(exercise) {
    if (this.isBugActive(exercise)) {
      return;
    }

    const { project } = exercise;

    this.setStatus(BugRunnerStatus.Busy);

    try {
      await this._enqueue(
        // Step 1: Clone, install the project
        this.installProject.bind(this, project),

        // Step 2: Do all the bug-related install work
        project.installBug.bind(project, exercise),

        // Step 3: Set as active bug
        this.setActivatedBug.bind(this, exercise)
      );
    }
    finally {
      this._updateStatus();
    }
  }

  /**
   * @typedef {Object} ExecuteResult
   * @property {number} code - the result code, usually the number of failed test
   */

  /**
   * Run test bug command (if in debug mode, will wait for debugger to attach)
   * @param {Exercise} exercise
   * @returns {Promise<ExecuteResult>}
   */
  async testExercise(exercise, cfg) {
    const { project } = exercise;
    try {
      this.setStatus(BugRunnerStatus.Busy);
      
      // init bug
      await project.initExercise(exercise);
      
      const { website } = exercise;

      // after Exercise, produce final cfg
      const cwd = pathNormalizedForce(path.resolve(project.projectPath, exercise.cwd || ''));

      cfg = {
        ...cfg,
        nodePath: this.manager.paths.node,
        cwd,
        debugPort: cfg?.debugMode && this.debugPort || null,
        dbuxJs: (cfg?.dbuxEnabled && project.needsDbuxCli) ? this.manager.getDbuxCliBinPath() : null,
        dbuxArgs: [cfg?.dbuxArgs, exercise.dbuxArgs].filter(a => !!a).join(' ')
      };

      // build the run command
      let commandOrCommandCfg = await project.runCommand(exercise, cfg);
      let command, runCfg;
      if (isObject(commandOrCommandCfg)) {
        ([command, runCfg] = commandOrCommandCfg);
      }
      else {
        command = commandOrCommandCfg;
      }

      runCfg = runCfg || {};
      runCfg.env = runCfg.env || {};
      if (runCfg.env.NODE_ENV && runCfg.env.NODE_ENV !== project.envName) {
        this.logger.warn(`runCfg.env.NODE_ENV !== project.envName:`, runCfg.env.NODE_ENV, project.envName);
      }
      runCfg.env.NODE_ENV = project.envName;

      if (command && !isString(command)) {
        throw new Error(`runCommand must return string or object or falsy, but instead returned: ${toString(commandOrCommandCfg)}`);
      }
      command = command?.trim().replace(/\s+/, ' ');  // get rid of unnecessary line-breaks and multiple spaces

      // ensure RuntimeServer is ready to receive results
      await this.manager.externals.initRuntimeServer();

      // start watch mode (if necessary)
      await project.startWatchModeIfNotRunning(exercise);

      if (command) {
        const result = await this.manager.execInTerminal(cwd, command, runCfg || EmptyObject);
        this._emitter.emit('testFinished', exercise, result);
        return result;
      }
      else if (website) {
        const waitForNewAppPromise = new Promise((resolve) => {
          const unsubscribe = allApplications.selection.onApplicationsChanged((apps) => {
            unsubscribe();
            resolve(apps);
          }, false);
        });
        const successful = await this.manager.externals.openWebsite(website);
        if (successful) {
          // NOTE: this used to work fine, but now, the promise never resolves. Maybe a recent VSCode bug.
          await waitForNewAppPromise;
        }
        else {
          this.logger.warn(`Cannot open website ${website}`);
        }
        return 0;
      }
      else {
        // nothing to do
        const message = 'runCommand did not return anything. Nothing left to do.';
        project.logger.debug(message);
        // throw new Error(`Invalid runCommand implementation in ${project} - did not return anything.`);
        return { message };
      }
    }
    catch (err) {
      const message = `Test run failed: ${err.message}`;
      project.logger.error(message);
      project.logger.warn(`  ${err.stack}`);
      return {
        error: true,
        message
      };
    }
    finally {
      this._updateStatus();
    }
  }

  /**
   * 
   */
  async _exec(cmd, logger, options = null, input) {
    if (this._process) {
      logger.error(`[possible race condition] executing command "${cmd}" while command "${this._process.command}" was already running`);
    }

    // // wait until current process finshed it's workload
    // this._process?.waitToEnd();

    this._process = new Process();
    try {
      await this._process.start(cmd, logger, options, input);
      return this._process.code;
    }
    finally {
      this._process = null;
    }
  }

  // NOTE: May cause error if used while running
  async cancel() {
    if (!this.isRunning()) {
      // nothing to do
      return;
    }

    // cancel all further steps already in queue
    const queuePromise = this._queue.cancel();

    // kill active terminal wrapper
    this._terminalWrapper?.cancel();
    this._terminalWrapper = null;

    // kill active process
    await this._process?.killSilent();

    await queuePromise;

    // kill background processes
    const backgroundProcesses = this.project?.backgroundProcesses || EmptyArray;
    await Promise.all(backgroundProcesses.map(p => p.killSilent()));

    await this.deactivateExercise();

    this.setStatus(BugRunnerStatus.None);
  }

  // ###########################################################################
  // status controll
  // ###########################################################################

  setStatus(status) {
    Verbose && this._ownLogger.log(`setStatus`, BugRunnerStatus.nameFrom(status));
    if (this.status !== status) {
      this.status = status;
      this._emitter.emit('statusChanged', status);
    }
  }

  /**
   * This should be called after all background progresses of a project finished, to set the status from `RunningInBackground` to `None`
   * @param {Project} project 
   */
  maybeSetStatusNone(project) {
    if (this.project !== project) {
      this._ownLogger.error(`Project ${project.name} claimed to finished its background processes after BugRunner deactivate it.`);
    }
    else if (project?.backgroundProcesses.length) {
      this._ownLogger.error(`Project ${project.name} called \`maybeSetStatusNone\` before all background processes finished.`);
    }
    else {
      this.setStatus(BugRunnerStatus.None);
    }
  }

  _updateStatus() {
    // need to check this.project exist, it might be kill during activating
    if (this.project?.backgroundProcesses.length) {
      this.setStatus(BugRunnerStatus.RunningInBackground);
    }
    else {
      this.setStatus(BugRunnerStatus.Done);
    }
  }

  onStatusChanged(cb) {
    cb(this.status);
    return this._emitter.on('statusChanged', cb);
  }

  // ###########################################################################
  //  Bug save util
  // ###########################################################################

  async setActivatedBug(bug = null) {
    this._exercise = bug;
    await this.manager.setKeyToExercise(activatedBugKeyName, bug);
  }

  /**
   * @returns {Promise<Exercise>} The deactivated exercise
   */
  async deactivateExercise() {
    const { exercise } = this;
    if (exercise) {
      await this.setActivatedBug(null);
      await this.manager.saveFileChanges(exercise);
      return exercise;
    }
    return null;
  }

  /**
   * @return {Exercise}
   */
  getSavedActivatedBug() {
    return this.manager.getExerciseByKey(activatedBugKeyName);
  }
}