import SerialTaskQueue from 'dbux-common/src/util/queue/SerialTaskQueue';

export default class BugRunner {
  _queue;

  constructor() {
    this._queue = new SerialTaskQueue();
  }

  // ###########################################################################
  // public getters
  // ###########################################################################

  isBusyActivating() {
    
  }

  isProjectActive(project) {
    
  }

  isBugActive(bug) {

  }

  // ###########################################################################
  // public methods
  // ###########################################################################

  activateProject(project) {

  }

  activateBug(bug) {
    
  }
}