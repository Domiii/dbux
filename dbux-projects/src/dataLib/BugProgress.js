import BugStatus from './BugStatus';

export default class BugProgress {
  constructor(bug, status = BugStatus.Solving, stopwatchEnabled) {
    const timeStamp = Date.now();
    this.projectName = bug.project.name;
    this.bugId = bug.id;
    this.createdAt = timeStamp;
    this.updatedAt = timeStamp;
    /**
     * @type {number|null}
     */
    this.startedAt = null;
    /**
     * @type {number|null}
     */
    this.solvedAt = null;
    this.stopwatchEnabled = stopwatchEnabled;
    this.status = status;
  }
}