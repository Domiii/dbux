import { env, Uri } from 'vscode';
import BugRunnerStatus from 'dbux-projects/src/projectLib/BugRunnerStatus';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class BugNode extends BaseTreeViewNode {
  static makeLabel(bug) {
    return bug.name;
  }

  init = () => {
    this.description = this.bug.description;
  }

  get bug() {
    return this.entry;
  }

  get contextValue() {
    const status = BugRunnerStatus.getName(this.status);
    const hasWebsite = this.bug.website ? 'hasWebsite' : '';
    return `dbuxProjectView.bugNode.${status}.${hasWebsite}`;
  }

  get status() {
    return this.bug.project.runner.getBugStatus(this.bug);
  }

  makeIconPath() {
    switch (this.status) {
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

  canHaveChildren() {
    return false;
  }

  handleClick() {

  }

  showWebsite() {
    if (this.bug.website) {
      env.openExternal(Uri.parse(this.bug.website));
    }
  }
}