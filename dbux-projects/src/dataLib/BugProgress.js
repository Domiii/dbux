import BugStatus from './BugStatus';

export default class BugProgress {
  constructor(bug, status = BugStatus.None) {
    const timeStamp = Date.now();
    this.projectName = bug.project.name;
    this.bugId = bug.id;
    this.createdAt = timeStamp;
    this.updatedAt = timeStamp;
    this.timePassed = 0;
    this.status = status;
  }
}