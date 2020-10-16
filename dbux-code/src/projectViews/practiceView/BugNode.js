import { env, Uri, window } from 'vscode';
import BugStatus from '@dbux/projects/src/dataLib/BugStatus';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

/** @typedef {import('@dbux/projects/src/projectLib/Bug').default} Bug */
/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

/** @typedef {import('@dbux/projects/src/projectLib/Bug').default} Bug */

export default class BugNode extends BaseTreeViewNode {
  static makeLabel(bug) {
    return bug.name;
  }

  init = () => {
    this.description = this.bug.description;
  }

  /**
   * @return {Bug}
   */
  get bug() {
    return this.entry;
  }

  /**
   * @return {ProjectsManager}
   */
  get manager() {
    return this.treeNodeProvider.controller.manager;
  }

  get contextValue() {
    const runStatus = RunStatus.getName(this.bug.runStatus);
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
    const progress = this.manager.bdp.getBugProgressByBug(this.bug);
    switch (progress?.status) {
      case BugStatus.Solving:
        return progress.stopwatchEnabled ? 'edit.svg' : 'edit.svg';
      case BugStatus.Attempted:
        return progress.stopwatchEnabled ? 'wrong.svg' : 'wrong_bw.svg';
      case BugStatus.Solved:
        return progress.stopwatchEnabled ? 'correct.svg' : 'correct_bw.svg';
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

  async showBugLog() {
    await this.bug.manager.showBugLog(this.bug);
  }
}