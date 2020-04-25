import defaultsDeep from 'lodash/defaultsDeep';
import sh from 'shelljs';
import SerialTaskQueue from 'dbux-common/src/util/queue/SerialTaskQueue';
import Process from 'dbux-projects/src/util/Process';
import Project from './Project';
import Bug from './Bug';
import EmptyObject from '../../../dbux-common/src/util/EmptyObject';

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
      'resetProject',
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
    return this._queue.isBusy();
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

  async resetProject(project) {
    project._installed = false;
    this._exec(project, 'rm -rf ./node_modules package-lock.json yarn.lock');
  }

  async getOrLoadBugs(project) {
    // if (!this.isProjectActive(project)) {
    //   await this.activateProject(project);
    // }
    return project.getOrLoadBugs();
  }

  async activateBug(bug) {
    if (this.isBugActive(bug)) {
      return;
    }

    // activate project
    await this._activateProject(bug.project);

    // select bug
    this._bug = bug;
    await bug.project.selectBug(bug);
  }

  /**
   * Run bug (if in debug mode, will wait for debugger to attach)
   */
  async testBug(bug, debugMode = true) {
    const { project } = bug;

    // do whatever it takes (usually: `activateProject` -> `git checkout`)
    await this._activateBug(bug);

    const cmd = await bug.project.testBugCommand(bug, debugMode && this.debugPort || null);
    await this._exec(project, cmd);
  }

  async _exec(project, cmd, options = null) {
    const {
      projectPath
    } = project;

    if (this._process) {
      project.logger.error(`[possible race condition] executing command "${cmd}" while command "${this._process.command}" was already running`);
    }

    // set cwd
    options = defaultsDeep(options, {
      processOptions: {
        cwd: projectPath
      }
    });

    // // wait until current process finshed it's workload
    // this._process?.waitToEnd();

    sh.cd(projectPath);

    this._process = new Process();
    try {
      return this._process.start(cmd, project.logger, options);
    }
    finally {
      this._process = null;
    }
  }

  async cancel() {
    await this._process?.kill();
    await this._queue.cancel();
  }
}