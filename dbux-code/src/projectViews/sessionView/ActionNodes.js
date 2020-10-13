import traceSelection from '@dbux/data/src/traceSelection';
import RunStatus, { isStatusRunningType } from '@dbux/projects/src/projectLib/RunStatus';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { showInformationMessage, showWarningMessage } from '../../codeUtil/codeModals';
import { emitTagTraceAction } from '../../userEvents';

class TagNode extends BaseTreeViewNode {
  static makeLabel() {
    return 'Found it';
  }

  init() {
    this.tooltip = 'Tag current trace as bug location';
  }

  async handleClick() {
    if (traceSelection.selected) {
      emitTagTraceAction(traceSelection.selected);
    }
    else {
      await showWarningMessage('You have not selected any trace yet.');
    }
  }
}

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

  get controller() {
    return this.treeNodeProvider.controller;
  }

  async handleClick() {
    if (RunStatus.is.Busy(this.manager.runStatus)) {
      await showInformationMessage('Currently busy, please wait');
    }
    else {
      await this.controller.activate(false);
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

  get controller() {
    return this.treeNodeProvider.controller;
  }

  async handleClick() {
    if (RunStatus.is.Busy(this.manager.runStatus)) {
      await showInformationMessage('Currently busy, please wait');
    }
    else {
      await this.controller.activate(true);
    }
  }
}

class StopPracticeNode extends BaseTreeViewNode {
  static makeLabel() {
    return 'Stop Practice';
  }

  init() {
    this.contextValue = 'dbuxSessionView.stopPracticeNode';
  }

  get manager() {
    return this.treeNodeProvider.manager;
  }

  get controller() {
    return this.treeNodeProvider.controller;
  }

  async handleClick() {
    if (RunStatus.is.Busy(this.manager.runStatus)) {
      await showInformationMessage('Currently busy, please wait');
    }
    else {
      await this.controller.maybeStopPractice();
    }
  }
}

export const ActionNodeClasses = [
  TagNode,
  RunNode,
  DebugNode,
  StopPracticeNode
];