import NanoEvents from 'nanoevents';
import sh from 'shelljs';
import SerialTaskQueue from '@dbux/common/src/util/queue/SerialTaskQueue';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Process from '../util/Process';
import progressLogHandler from '../dataLib/progressLog';
import Project from './Project';
import Bug from './Bug'; // eslint-disable-line no-unused-vars
import BugRunnerStatus from './BugRunnerStatus';

export default class BugRunner {
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

  constructor(manager, storage) {
    this.manager = manager;
    this.storage = storage;
    this._ownLogger = newLogger('BugRunner');
    this._emitter = new NanoEvents();
    this.status = BugRunnerStatus.None;
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

    // make sure, `projectsRoot` exists
    const { projectsRoot } = this.manager.config;
    sh.mkdir('-p', projectsRoot);

    this._queue = new SerialTaskQueue('BugRunnerQueue');

    // TODO: synchronized methods deadlock when they call each other
    // this._queue.synchronizedMethods(this, //this._wrapSynchronized,
    //   'activateProject',
    //   'activateBug',
    //   'testBug',
    //   // 'exec'
    // );
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
    return this._project === project && project._installed;
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
   * NOTE: synchronized.
   */
  async activateProject(project) {
    if (this.isProjectActive(project)) {
      return;
    }

    this._project = project;

    // Runner become busy after starting installing project, setStatus should be called after this._project is set
    this.setStatus(BugRunnerStatus.Busy);

    await project.installProject();
    project._installed = true;
  }

  getOrLoadBugs(project) {
    // if (!this.isProjectActive(project)) {
    //   await this.activateProject(project);
    // }
    return project.getOrLoadBugs();
  }

  async saveBugPatchAndUpdateStorage(bug) {
    const keyName = 'activatedBug';
    let previousBugInformation = this.manager.externals.storage.get(keyName);

    if (previousBugInformation) {
      let { projectName, bugId } = previousBugInformation;

      let previousProject = this.manager.getOrCreateDefaultProjectList().getByName(projectName);

      if (await previousProject.isProjectFolderExists()) {
        let previousBug = previousProject.getOrLoadBugs().getById(bugId);

        await this.manager.saveRunningBug(previousBug);
        await previousBug.project.gitResetHard();
      }
    }

    await this.manager.externals.storage.set(keyName, {
      projectName: bug.project.name,
      bugId: bug.id,
    });
  }

  /**
   * @param {Bug} bug 
   */
  async activateBug(bug) {
    if (this.isBugActive(bug)) {
      return;
    }

    await this.saveBugPatchAndUpdateStorage(bug);

    const { project } = bug;
    this._bug = bug;

    await this._queue.enqueue(
      // activate project
      async () => this.activateProject(project),
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
      // start watch mode (if necessary)
      async () => project.startWatchModeIfNotRunning(),
      // select bug
      async () => project.selectBug(bug)
    );
  }

  /**
   * Run bug (if in debug mode, will wait for debugger to attach)
   * 
   * @param {}
   */
  async testBug(bug, debugMode = true) {
    const { project } = bug;

    try {
      // do whatever it takes (usually: `activateProject` -> `git checkout`)
      await this.activateBug(bug);

      // apply stored patch
      if (!await bug.project.manager.applyNewBugPatch(bug)) {
        return null;
      }

      // hackfix: set status here again in case of `this.activateBug` skips installaion process
      this.setStatus(BugRunnerStatus.Busy);

      let command = await bug.project.testBugCommand(bug, debugMode && this.debugPort || null);
      command = command.trim().replace(/\s+/, ' ');  // get rid of unnecessary line-breaks and multiple spaces

      if (!command) {
        // nothing to do
        project.logger.debug('has no test command. Nothing left to do.');
        // throw new Error(`Invalid testBugCommand implementation in ${project} - did not return anything.`);
        return null;
      }
      else {
        const cwd = project.projectPath;
        this._terminalWrapper = this.manager.externals.execInTerminal(cwd, command);
        const result = await this._terminalWrapper.waitForResult();
        progressLogHandler.processBugResult(this.storage, bug, result);
        project.logger.log(`Result:`, result);
        return result;
      }
    }
    finally {
      // need to check this._project exist, it might be kill during activating
      if (this._project?.backgroundProcesses.length) {
        this.setStatus(BugRunnerStatus.RunningInBackground);
      }
      else {
        this.setStatus(BugRunnerStatus.Done);
      }
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

  on(evtName, cb) {
    this._emitter.on(evtName, cb);
  }

  getProjectStatus(project) {
    if (this._project === project) {
      return this.status;
    }
    else {
      return BugRunnerStatus.None;
    }
  }

  getBugStatus(bug) {
    if (this._bug === bug) {
      return this.status;
    }
    else {
      return BugRunnerStatus.None;
    }
  }
}