import { env, Uri, window } from 'vscode';
import BugStatus from '@dbux/projects/src/dataLib/BugStatus';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
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

  get manager() {
    return this.treeNodeProvider.controller.manager;
  }

  get contextValue() {
    const runStatus = RunStatus.getName(this.runStatus);
    const hasWebsite = this.bug.website ? 'hasWebsite' : '';
    return `dbuxProjectView.bugNode.${runStatus}.${hasWebsite}`;
  }

  makeIconPath() {
    switch (this.bug.runStatus) {
      case RunStatus.Busy:
        return 'hourglass.svg';
      case RunStatus.RunningInBackground:
        return 'play.svg';
    }
    const progress = this.manager.progressLogController.util.getBugProgressByBug(this.bug);
    switch (progress?.status) {
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
}