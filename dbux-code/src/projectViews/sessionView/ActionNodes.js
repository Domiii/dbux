import traceSelection from '@dbux/data/src/traceSelection';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import BugStatus from '@dbux/projects/src/dataLib/BugStatus';
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

/** @typedef {import('@dbux/projects/src/projectLib/Bug').default} Bug */

class DetailNode extends BaseTreeViewNode {
  /**
   * @param {Bug} bug 
   */
  static makeLabel(bug) {
    const { status } = bug.manager.progressLogController.util.getBugProgressByBug(bug);
    return `${bug.id} (${BugStatus.getName(status)})`;
  }

  init() {
    this.contextValue = 'dbuxSessionView.detailNode';
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

class ShowEntryNode extends BaseTreeViewNode {
  static makeLabel() {
    return 'Show entry file';
  }

  init() {
    this.contextValue = 'dbuxSessionView.showEntryNode';
  }

  get manager() {
    return this.treeNodeProvider.manager;
  }

  async handleClick() {
    if (RunStatus.is.Busy(this.manager.runStatus)) {
      await showInformationMessage('Currently busy, please wait');
    }
    else {
      await this.entry.openInEditor();
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
  DetailNode,
  RunNode,
  DebugNode,
  ShowEntryNode,
  StopPracticeNode
];