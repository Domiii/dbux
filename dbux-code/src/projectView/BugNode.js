import BugRunnerStatus, { isStatusRunningType } from 'dbux-projects/src/projectLib/BugRunnerStatus';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class BugNode extends BaseTreeViewNode {
  static makeLabel(bug) {
    return bug.name;
  }

  get bug() {
    return this.entry;
  }

  get runner() {
    return this.bug.project.runner;
  }

  isActive() {
    return isStatusRunningType(this.runner.getBugStatus(this.bug));
  }

  makeIconPath() {
    const status = this.runner.getBugStatus(this.bug);
    switch (status) {
      case BugRunnerStatus.None:
        return '';
      case BugRunnerStatus.Busy:
        return 'hourglass.svg';
      case BugRunnerStatus.RunningInBackground:
        return 'play.svg';
      case BugRunnerStatus.Done:
        return 'dependency.svg';
      default:
        return '';
    }
  }

  init = () => {
    this.contextValue = 'dbuxProjectView.bugNode' + (this.isActive() ? '.activated' : '');
    this.description = this.bug.description;
  }

  canHaveChildren() {
    return false;
  }

  handleClick() {

  }
}