import { env, Uri } from 'vscode';
import bugsInformationHandler from 'dbux-projects/src/dataLib/BugsInformation';
import BugResultStatusType from 'dbux-projects/src/dataLib/BugResultStatusType';
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

  get result() {
    return bugsInformationHandler.getBugResultByBug(this.bug.manager.bugsInformation, this.bug)?.status;
  }

  makeIconPath() {
    switch (this.result) {
      case BugResultStatusType.None:
        return '';
      case BugResultStatusType.Attempted:
        return 'hourglass.svg';
      case BugResultStatusType.Solved:
        return 'correct.svg';
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