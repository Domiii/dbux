import NanoEvents from 'nanoevents';
import sh from 'shelljs';
import SerialTaskQueue from '@dbux/common/src/util/queue/SerialTaskQueue';
import sleep from '@dbux/common/src/util/sleep';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Process from '../util/Process';
import BugRunnerStatus from './RunStatus';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */
/** @typedef {import('./Bug').default} Bug */
/** @typedef {import('./Project').default} Project */

const Verbose = true;

export default class BugRunner {
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
   * @type {Bug}
   */
  _bug;

  debugPort = 9853;

  constructor(manager) {
    this.manager = manager;
    this.status = BugRunnerStatus.None;
    this._ownLogger = newLogger('BugRunner');
    this._emitter = new NanoEvents();
  }

  get logger() {
    return this._project?.logger || this._ownLogger;
  }

  get bug() {
    return this._bug;
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
    return this._queue.isBusy() || this._process || this._project;
  }

  isProjectActive(project) {
    return this._project === project;
  }

  isBugActive(bug) {
    return this._bug === bug;
  }

  getActiveBug() {
    return this._bug;
  }

  // ###########################################################################
  // activation methods
  // ###########################################################################

  // async _runOnProject(cb, ...args) {
  //   const project = this._project;
  //   project._runner = this;
  //   try {
  //     return cb.apply(project, ...args);
  //   }
  //   finally {
  //     project._runner = null;
  //   }
  // }

  /**
   * Install project
   * NOTE: synchronized.
   */
  async activateProject(project) {
    if (this.isProjectActive(project) && project._installed) {
      return;
    }

    await project.installProject();
    project._installed = true;
  }

  getOrLoadBugs(project) {
    return project.getOrLoadBugs();
  }

  /**
   * Install bug
   * @param {Bug} bug 
   */
  async activateBug(bug) {
    if (this.isBugActive(bug)) {
      return;
    }

    const { project } = bug;
    this._bug = bug;
    this._project = project;

    this.setStatus(BugRunnerStatus.Busy);

    await this._queue.enqueue(
      // install project
      async () => this.activateProject(project),
      // apply patch if needed
      async () => {
        // git reset hard
        // TODO: make sure, user gets to save own changes first
        sh.cd(project.projectPath);
        if (bug.patch) {
          await project.gitResetHard();
        }
      },
      async () => {
        // activate patch
        if (bug.patch) {
          await project.applyPatch(bug.patch);
        }
      },
      // select bug
      async () => project.selectBug(bug),
      // start watch mode (if necessary)
      async () => project.startWatchModeIfNotRunning(bug),
    );

    this._updateStatus();
  }

  /**
   * @typedef {Object} ExecuteResult
   * @property {number} code - the result code, usually the number of failed test
   */

  /**
   * Run test bug command (if in debug mode, will wait for debugger to attach)
   * @param {Bug} bug
   * @returns {Promise<ExecuteResult>}
   */
  async testBug(bug, cfg) {
    const { project } = bug;

    try {
      this.setStatus(BugRunnerStatus.Busy);

      cfg = {
        debugPort: cfg?.debugMode && this.debugPort || null,
        dbuxJs: this.manager.getDbuxCliBinPath(),
        // dbuxArgs: '--dontInjectDbux',
        // nodeArgs: '--enable-source-maps' // TODO: make this configurable
        ...cfg,
      };
      let command = await bug.project.testBugCommand(bug, cfg);
      command = command?.trim().replace(/\s+/, ' ');  // get rid of unnecessary line-breaks and multiple spaces

      if (!command) {
        // nothing to do
        project.logger.debug('has no test command. Nothing left to do.');
        // throw new Error(`Invalid testBugCommand implementation in ${project} - did not return anything.`);
        return null;
      }
      else {
        const cwd = project.projectPath;
        // const devMode = process.env.NODE_ENV === 'development';
        const args = {
          // NOTE: DBUX_ROOT + NODE_ENV are provided by webpack

          // DBUX_ROOT: devMode ? fs.realpathSync(path.join(__dirname, '..', '..')) : null,
          // NODE_ENV: process.env.NODE_ENV
        };
        // `args` in execInTerminal not working with anything now
        const result = await this.manager.execInTerminal(cwd, command, args);
        project.logger.log(`Result: ${result}`);
        this._emitter.emit('testFinished', bug, result);
        return result;
      }
    }
    finally {
      // need to check this._project exist, it might be kill during activating
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
      return await this._process.start(cmd, logger, options, input);
    }
    finally {
      this._process = null;
    }
  }

  // NOTE: May cause error if used while running
  async cancel() {
    if (!this.isBusy()) {
      // nothing to do
      return;
    }

    // cancel all further steps already in queue
    const queuePromise = this._queue.cancel();

    // kill active terminal wrapper
    this._terminalWrapper?.cancel();
    this._terminalWrapper = null;

    // kill active process
    await this._process?.kill();

    await queuePromise;

    // kill background processes
    const backgroundProcesses = this._project?.backgroundProcesses || EmptyArray;
    await Promise.all(backgroundProcesses.map(p => p.kill()));

    this._bug = null;
    this._project = null;

    this.setStatus(BugRunnerStatus.None);
  }

  // ###########################################################################
  // status controll
  // ###########################################################################

  setStatus(status) {
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
    if (!this._project || this._project !== project) {
      this._ownLogger.error(`Project ${project.name} claimed to finished its background processes after BugRunner deactivate it.`);
    }
    else if (project.backgroundProcesses.length) {
      this._ownLogger.error(`Project ${project.name} called \`maybeSetStatusNone\` before all background processes finished.`);
    }
    else {
      this.setStatus(BugRunnerStatus.None);
    }
  }

  _updateStatus() {
    if (this._project?.backgroundProcesses.length) {
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
}