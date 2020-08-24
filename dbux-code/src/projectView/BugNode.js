import { env, Uri, window } from 'vscode';
import BugStatus from '@dbux/projects/src/dataLib/BugStatus';
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
    const runStatus = BugRunnerStatus.getName(this.runStatus);
    const hasWebsite = this.bug.website ? 'hasWebsite' : '';
    return `dbuxProjectView.bugNode.${runStatus}.${hasWebsite}`;
  }

  get runStatus() {
    return this.bug.project.runner.getBugRunStatus(this.bug);
  }

  get result() {
    return this.bug.manager.progressLogController.util.getBugProgressByBug(this.bug)?.status;
  }

  makeIconPath() {
    switch (this.runStatus) {
      case BugRunnerStatus.Busy:
        return 'hourglass.svg';
      case BugRunnerStatus.RunningInBackground:
        return 'play.svg';
    }
    switch (this.result) {
      case BugStatus.Attempted:
        return 'wrong.svg';
      case BugStatus.Solved:
        return 'correct.svg';
    }
    return ' ';
  }

  canHaveChildren() {
    return false;
  }

  handleClick() {

  }

  async showWebsite() {
    if (this.bug.website) {
      return env.openExternal(Uri.parse(this.bug.website));
    }

    // return false to indicate that no website has been opened
    return false;
  }

  async tryResetBug() {
    try {
      await this.bug.manager.resetBug(this.bug);
    }
    catch (err) {
      if (!err.userCanceled) {
        throw err;
      }
      else {
        window.showInformationMessage('Action canceled.');
      }
    }
  }

  async showBugIntroduction() {
    await this.bug.manager.externals.showBugIntroduction(this.bug);
  }
}