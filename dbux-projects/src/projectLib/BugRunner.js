import NanoEvents from 'nanoevents';
import path from 'path';
import sh from 'shelljs';
import SerialTaskQueue from '@dbux/common/src/util/queue/SerialTaskQueue';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import Process from '../util/Process';
import BugRunnerStatus from './RunStatus';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */
/** @typedef {import('./Bug').default} Bug */
/** @typedef {import('./Project').default} Project */

const activatedBugKeyName = 'dbux.dbux-projects.activatedBug';

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

    this._bug = this.getSavedActivatedBug();
  }

  get logger() {
    return this.project?.logger || this._ownLogger;
  }

  get bug() {
    return this._bug;
  }

  get project() {
    return this.bug?.project || null;
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
    return this._queue.isBusy() || this._process || this.bug;
  }

  isProjectActive(project) {
    return this.project === project;
  }

  isBugActive(bug) {
    return this.bug === bug;
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
   * Install project
   * NOTE: synchronized.
   */
  async activateProject(project) {
    if (this.isProjectActive(project) && project._installed) {
      return;
    }

    // init
    await project.initProject();

    // install
    await project.installProject();
    project._installed = true;
  }

  getOrLoadBugs(project) {
    return project.getOrLoadBugs();
  }

  /**
   * Enqueue a bunch of callbacks into the queue.
   */
  async _enqueue(...cbs) {
    return await this._queue.enqueue(...cbs);
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

    this.setStatus(BugRunnerStatus.Busy);

    try {
      await this._enqueue(
        // install project
        this.activateProject.bind(this, project),
        // git reset hard
        project.gitResetHardForBug.bind(project, bug),
        // async () => {
        //   // activate patch
        //   // if (bug.patch) {
        //   //   await project.applyPatch(bug.patch);
        //   // }
        // },
        // select bug

        project.selectBug.bind(project, bug),

        // `npm install` again (NOTE: the newly checked out tag might have different dependencies)
        project.npmInstall.bind(project),
        // Copy assets again in this branch
        project.installAssets.bind(project),
        // Auto commit again
        project.autoCommit.bind(project, bug),

        async () => await this.saveActivatedBug()
      );
    }
    catch (err) {
      this._bug = null;
      throw err;
    }
    finally {
      this._updateStatus();
    }
  }

  async deactivateBug() {
    const { bug } = this;
    this._bug = null;
    await this.saveActivatedBug();
    return bug;
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
    const { project, website } = bug;

    try {
      this.setStatus(BugRunnerStatus.Busy);

      // init bug
      await project.initBug(bug);

      const cwd = path.resolve(project.projectPath, bug.cwd || '');

      cfg = {
        cwd,
        debugPort: cfg?.debugMode && this.debugPort || null,
        dbuxJs: cfg?.dbuxEnabled ? this.manager.getDbuxCliBinPath() : null,
        ...cfg,
      };

      // build the run command
      let command = await project.testBugCommand(bug, cfg);
      command = command?.trim().replace(/\s+/, ' ');  // get rid of unnecessary line-breaks and multiple spaces

      // ensure RuntimeServer is ready to receive the result
      await this.manager.externals.initRuntimeServer();

      // start watch mode (if necessary)
      await project.startWatchModeIfNotRunning(bug);

      if (command) {
        // const devMode = process.env.NODE_ENV === 'development';
        const args = {
          // NOTE: DBUX_ROOT + NODE_ENV are provided by webpack

          // DBUX_ROOT: devMode ? fs.realpathSync(path.join(__dirname, '..', '..')) : null,
          // NODE_ENV: process.env.NODE_ENV
        };
        // `args` in execInTerminal not working with anything now
        const result = await this.manager.execInTerminal(cwd, command, args);
        this._emitter.emit('testFinished', bug, result);
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
          await waitForNewAppPromise;
        }
        else {
          this.logger.warn(`Cannot open website ${website}`);
        }
        return 0;
      }
      else {
        // nothing to do
        project.logger.debug('testBugCommand did not return anything. Nothing left to do.');
        // throw new Error(`Invalid testBugCommand implementation in ${project} - did not return anything.`);
        return null;
      }
    }
    catch (err) {
      project.logger.error(`Test run failed: ${err.message}`);
      project.logger.warn(`  ${err.stack}`);
      return null;
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
    await this._process?.killSilent();

    await queuePromise;

    // kill background processes
    const backgroundProcesses = this.project?.backgroundProcesses || EmptyArray;
    await Promise.all(backgroundProcesses.map(p => p.killSilent()));

    await this.deactivateBug();

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

  async saveActivatedBug() {
    await this.manager.setKeyToBug(activatedBugKeyName, this.bug);
  }

  /**
   * @return {Bug}
   */
  getSavedActivatedBug() {
    return this.manager.getBugByKey(activatedBugKeyName);
  }
}