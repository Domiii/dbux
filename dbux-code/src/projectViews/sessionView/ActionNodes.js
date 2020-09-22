import { isStatusRunningType } from '@dbux/projects/src/projectLib/RunStatus';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { showInformationMessage } from '../../codeUtil/codeModals';

class RunNode extends BaseTreeViewNode {
  static makeLabel() {
    return 'Run';
  }

  init() {
    this.contextValue = 'dbuxSessionView.runNode';
  }

  get manager() {
    return this.treeNodeProvider.manager;
  }

  async handleClick() {
    if (isStatusRunningType(this.manager.runStatus)) {
      await showInformationMessage('Currently busy, please wait');
    }
    else {
      await this.manager.activate(false);
    }
  }
}

class DebugNode extends BaseTreeViewNode {
  static makeLabel() {
    return 'Debug';
  }

  init() {
    this.contextValue = 'dbuxSessionView.debugNode';
  }

  get manager() {
    return this.treeNodeProvider.manager;
  }

  async handleClick() {
    if (isStatusRunningType(this.manager.runStatus)) {
      await showInformationMessage('Currently busy, please wait');
    }
    else {
      await this.manager.activate(true);
    }
  }
}



export const ActionNodeClasses = [
  RunNode,
  DebugNode
];