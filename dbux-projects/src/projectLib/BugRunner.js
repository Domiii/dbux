import NanoEvents from 'nanoevents';
import defaultsDeep from 'lodash/defaultsDeep';
import sh from 'shelljs';
import SerialTaskQueue from 'dbux-common/src/util/queue/SerialTaskQueue';
import Process from 'dbux-projects/src/util/Process';
import EmptyObject from 'dbux-common/src/util/EmptyObject';
import { newLogger } from 'dbux-common/src/log/logger';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import Project from './Project';
import Bug from './Bug';

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

  constructor(manager) {
    this.manager = manager;
    this._ownLogger = newLogger('BugRunner');
    this._emitter = new NanoEvents();
    this.bugActivating = 0;
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
    this._queue.synchronizedMethods(this, //this._wrapSynchronized,
      'activateProject',
      'activateBug',
      'testBug',
      // 'exec'
    );
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
    await project.installProject();
    project._installed = true;
  }

  async getOrLoadBugs(project) {
    // if (!this.isProjectActive(project)) {
    //   await this.activateProject(project);
    // }
    return project.getOrLoadBugs();
  }

  /**
   * @param {Bug} bug 
   */
  async activateBug(bug) {
    if (this.isBugActive(bug)) {
      return;
    }

    const { project } = bug;
    this._bug = bug;
    this._emitter.emit('start', bug);

    this.bugActivating += 1;

    try {
      // activate project
      await this._activateProject(project);

      // git reset hard
      // TODO: make sure, user gets to save own changes first
      sh.cd(project.projectPath);
      await project.exec('git reset --hard');

      if (bug.patch) {
        // activate patch
        await project.applyPatch(bug.patch);
      }

      // start watch mode (if necessary)
      await project.startWatchModeIfNotRunning();

      // select bug
      await project.selectBug(bug);
    } finally {
      this.bugActivating += -1;
      this.maybeNotifyEnd();
    }
  }

  /**
   * Run bug (if in debug mode, will wait for debugger to attach)
   */
  async testBug(bug, debugMode = true) {
    const { project } = bug;

    // do whatever it takes (usually: `activateProject` -> `git checkout`)
    await this._activateBug(bug);

    const cmd = await bug.project.testBugCommand(bug, debugMode && this.debugPort || null);

    if (!cmd) {
      // throw new Error(`Invalid testBugCommand implementation in ${project} - did not return anything.`);
    }
    else {
      await this._exec(project, cmd);
    }
  }

  /**
   * @param {boolean} options.cdToProjectPath [Default=true] Whether to cd to `project.projectPath`.
   */
  async _exec(project, cmd, options = null) {
    const {
      projectPath
    } = project;

    if (this._process) {
      project.logger.error(`[possible race condition] executing command "${cmd}" while command "${this._process.command}" was already running`);
    }

    // set cwd
    let cwd;
    if (options?.cdToProjectPath !== false) {
      cwd = projectPath;

      // set cwd option
      options = defaultsDeep(options, {
        processOptions: {
          cwd
        }
      });

      // cd into it
      sh.cd(cwd);
    }

    // // wait until current process finshed it's workload
    // this._process?.waitToEnd();

    this._process = new Process();
    try {
      return await this._process.start(cmd, project.logger, options);
    }
    finally {
      this._process = null;
    }
  }

  async cancel() {
    if (!this.isBusy()) {
      // nothing to do
      return;
    }

    this.logger.debug('Cancelling...');

    // cancel all further steps already in queue
    await this._queue.cancel();

    // kill active process
    await this._process?.kill();

    // kill background processes
    const backgroundProcesses = this._project?.backgroundProcesses || EmptyArray;
    await Promise.all(backgroundProcesses.map(p => p.kill()));

    this._bug = null;
    this._project = null;
  }

  maybeNotifyEnd() {
    if (this._project && !this._project.backgroundProcesses.length && !this.bugActivating) {
      this._emitter.emit('end');
    }
  }

  on(evtName, cb) {
    this._emitter.on(evtName, cb);
  }
}