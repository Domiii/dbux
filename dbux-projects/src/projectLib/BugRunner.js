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
import Process from '../util/Process';
import BugRunnerStatus, { isStatusRunningType } from './RunStatus';

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

    // NOTE: We use git tags instead of externalStorage saves for safety 
    // this._bug = this.getSavedActivatedBug();
    this._bug = null;
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
   * @param {Bug} bug 
   */
  async installBug(bug) {
    if (this.isBugActive(bug)) {
      return;
    }

    const { project } = bug;
    const installedTag = project.getProjectInstalledTagName();
    const bugSelectedTag = project.getBugSelectedTagName(bug);

    if (await project.gitDoesTagExist(bugSelectedTag)) {
      await project.gitCheckout(bugSelectedTag);
    }
    else {
      await project.gitCheckout(installedTag);
      // apply bug patch or checkout to tag
      await project.selectBug(bug);

      // Add selected tag
      await project.autoCommit(`Select bug ${bug.id}`);
      await project.gitSetTag(bugSelectedTag);
    }
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
   * @param {Bug} bug 
   */
  async activateBug(bug) {
    if (this.isBugActive(bug)) {
      return;
    }

    const { project } = bug;

    this.setStatus(BugRunnerStatus.Busy);

    try {
      await this._enqueue(
        // Step 1: Clone, install the project
        this.installProject.bind(this, project),

        // Step 2: Apply patch or checkout to specific commit
        this.installBug.bind(this, bug),

        // Step 3: Do these again to get the latest update
        project.installAssets.bind(project),
        project.npmInstall.bind(project),

        // Step 4: Auto commit in the end to avoid `uncommit changes` error for any further git operation
        project.autoCommit.bind(project),
        this.setActivatedBug.bind(this, bug)
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
   * @param {Bug} bug
   * @returns {Promise<ExecuteResult>}
   */
  async testBug(bug, cfg) {
    const { project, website } = bug;

    try {
      this.setStatus(BugRunnerStatus.Busy);

      // init bug
      await project.initBug(bug);

      // after initBug, produce final cfg
      const cwd = path.resolve(project.projectPath, bug.cwd || '');

      cfg = {
        ...cfg,
        cwd,
        debugPort: cfg?.debugMode && this.debugPort || null,
        dbuxJs: (cfg?.dbuxEnabled && project.needsDbuxCli) ? this.manager.getDbuxCliBinPath() : null,
        dbuxArgs: [cfg?.dbuxArgs, bug.dbuxArgs].filter(a => !!a).join(' ')
      };

      // build the run command
      let commandOrCommandCfg = await project.testBugCommand(bug, cfg);
      let command, commandOptions;
      if (isObject(commandOrCommandCfg)) {
        ([command, commandOptions] = commandOrCommandCfg);
      }
      else if (commandOrCommandCfg && !isString(commandOrCommandCfg)) {
        throw new Error(`testBugCommand must return string or object or falsy, but instead returned: ${toString(commandOrCommandCfg)}`);
      }
      else {
        command = commandOrCommandCfg;
      }
      command = command?.trim().replace(/\s+/, ' ');  // get rid of unnecessary line-breaks and multiple spaces

      // ensure RuntimeServer is ready to receive the result
      await this.manager.externals.initRuntimeServer();

      // start watch mode (if necessary)
      await project.startWatchModeIfNotRunning(bug);

      if (command) {
        const result = await this.manager.execInTerminal(cwd, command, commandOptions || EmptyObject);
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

  async setActivatedBug(bug = null) {
    this._bug = bug;
    await this.manager.setKeyToBug(activatedBugKeyName, bug);
  }

  /**
   * @returns {Promise<Bug>} The deactivated bug
   */
  async deactivateBug() {
    const { bug } = this;
    await this.setActivatedBug(null);
    return bug;
  }

  /**
   * @return {Bug}
   */
  getSavedActivatedBug() {
    return this.manager.getBugByKey(activatedBugKeyName);
  }
}