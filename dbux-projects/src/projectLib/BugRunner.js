import SerialTaskQueue from 'dbux-common/src/util/queue/SerialTaskQueue';
import { newLogger } from 'dbux-common/src/log/logger';
import sh from 'shelljs';
import Project from './Project';
import Bug from './Bug';

const { log, debug, warn, error: logError } = newLogger('dbux-code');

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

  async testBug(bug) {
    await this._activateBug(bug);

    await bug.project.testBug(bug, this.debugPort);
  }
}