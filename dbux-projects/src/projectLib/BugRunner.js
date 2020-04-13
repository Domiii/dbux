import SerialTaskQueue from 'dbux-common/src/util/queue/SerialTaskQueue';
import { newLogger } from 'dbux-common/src/log/logger';
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

  constructor(manager) {
    this.manager = manager;
    this._queue = new SerialTaskQueue('BugRunnerQueue');

    this._queue.synchronizedMethods(this,
      'activateProject',
      'activateBug'
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
    
    console.debug('activateBug', 0);

    // activate project
    await this.activateProject(bug.project);
    console.debug('activateBug', 1);
    
    // select bug
    this._bug = bug;
    await bug.project.selectBug(bug);

    console.debug('activateBug', 2);
  }
}