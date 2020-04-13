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

    // TODO: synchronized methods deadlock when they call each other
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

  /**
   * NOTE: synchronized.
   */
  async activateProject(project) {
    return this._activateProject(project);
  }

  /**
   * NOTE: Not synchronized.
   */
  async _activateProject(project) {
    if (this.isProjectActive(project)) {
      return;
    }

    this._project = project;
    await project.installProject();
  }

  async activateBug(bug) {
    return this._activateBug(bug);
  }

  async _activateBug(bug) {
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
    // TODO: use bug.runArgs
    // TODO: add "attach to node" `launch.json` entry (via externals)
    
    /*
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to any node program",
      "port": 9229
    }
    */
  }
}