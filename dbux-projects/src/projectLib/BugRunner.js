import sh from 'shelljs';
import SerialTaskQueue from 'dbux-common/src/util/queue/SerialTaskQueue';
import Process from 'dbux-projects/src/util/Process';
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
    this._queue.synchronizedMethods(this,
      'activateProject',
      'activateBug',
      'testBug'
    );
  }

  // ###########################################################################
  // public getters
  // ###########################################################################

  isBusy() {
    return this._queue.isBusy();
  }

  isProjectActive(project) {
    return this._project === project;
  }

  isBugActive(bug) {
    return this._bug === bug;
  }

  // ###########################################################################
  // activation methods
  // ###########################################################################

  /**
   * NOTE: synchronized.
   */
  async activateProject(project) {
    if (this.isProjectActive(project)) {
      return;
    }

    this._project = project;
    await project.installProject();
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
    const {
      projectPath
    } = project;

    // do whatever it takes (usually: `activateProject` -> `git checkout`)
    await this._activateBug(bug);

    const cmd = await bug.project.testBugCommand(bug, debugMode && this.debugPort || null);
    const commandOptions = {
      cwd: projectPath
    };

    this._process = new Process();
    try {
      return this._process.start(cmd, project.logger, commandOptions);
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