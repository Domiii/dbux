import { env, Uri } from 'vscode';
import progressLogHandler from '@dbux/projects/src/dataLib/progressLog';
import BugResultStatusType from '@dbux/projects/src/dataLib/BugResultStatusType';
import BugRunnerStatus from '@dbux/projects/src/projectLib/BugRunnerStatus';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';
import 'lodash';

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
    return progressLogHandler.getBugResultByBug(this.bug.manager.progressLog, this.bug)?.status;
  }

  makeIconPath() {
    switch (this.status) {
      case BugRunnerStatus.Busy:
        return 'hourglass.svg';
      case BugRunnerStatus.RunningInBackground:
        return 'play.svg';
    }
    switch (this.result) {
      case BugResultStatusType.Attempted:
        return 'wrong.svg';
      case BugResultStatusType.Solved:
        return 'correct.svg';
    }
    return ' ';
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