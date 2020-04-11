import SerialTaskQueue from 'dbux-common/src/util/queue/SerialTaskQueue';
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

  constructor(manager) {
    this.manager = manager;
    this._queue = new SerialTaskQueue();

    this._queue.synchronizedMethods(this, [
      'activateProject',
      'activateBug'
    ]);
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

  async activateProject(project) {
    if (this.isProjectActive(project)) {
      return;
    }
    
    this._project = project;
    await project.installProject();
  }

  async activateBug(bug) {
    if (this.isBugActive(bug)) {
      return;
    }

    // activate project
    await this.activateProject(bug.project);
    
    // select bug
    this._bug = bug;
    await bug.project.selectBug(bug);
  }
}