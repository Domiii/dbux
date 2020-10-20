import traceSelection from '@dbux/data/src/traceSelection';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import PracticeSessionState from '@dbux/projects/src/practiceSession/PracticeSessionState';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { showInformationMessage, showWarningMessage } from '../../codeUtil/codeModals';
import { emitTagTraceAction } from '../../userEvents';

class SessionNode extends BaseTreeViewNode {
  get bug() {
    return this.entry;
  }
}

/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */
/** @typedef {import('@dbux/projects/src/projectLib/Bug').default} Bug */

class DetailNode extends SessionNode {
  /**
   * @param {Bug} bug 
   */
  static makeLabel(bug) {
    const state = bug.manager.practiceSession?.state;
    return `Current bug: ${bug.label} (${PracticeSessionState.getName(state)})`;
  }

  init() {
    this.contextValue = 'dbuxSessionView.detailNode';
    this.description = this.bug.id;
  }
}

class TagNode extends SessionNode {
  static makeLabel() {
    return 'I found it! (tag this trace)';
  }

  init() {
    this.tooltip = 'Tag current trace as bug location';
  }

  /**
   * @return {ProjectsManager}
   */
  get manager() {
    return this.treeNodeProvider.manager;
  }

  async handleClick() {
    const trace = traceSelection.selected;
    if (trace) {
      emitTagTraceAction(trace);
      this.manager.practiceSession.tagBugTrace(trace);
    }
    else {
      await showWarningMessage('You have not selected any trace yet.');
    }
  }
}

class RunNode extends SessionNode {
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
      await this.controller.activate();
    }
  }
}

class DebugWithoutDbuxNode extends SessionNode {
  static makeLabel() {
    return 'Debug without Dbux';
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
      await this.controller.activate({ debugMode: true, dbuxEnabled: false });
    }
  }
}

class RunWithoutDbuxNode extends SessionNode {
  static makeLabel() {
    return 'Run without Dbux';
  }

  init() {
    this.contextValue = 'dbuxSessionView.runWithoutDbuxNode';
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
      await this.controller.activate({ dbuxEnabled: false });
    }
  }
}

class ShowEntryNode extends SessionNode {
  static makeLabel() {
    return 'Go to program entry point';
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

class StopPracticeNode extends SessionNode {
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
  DetailNode,
  ShowEntryNode,
  RunNode,
  RunWithoutDbuxNode,
  DebugWithoutDbuxNode,
  TagNode,
  StopPracticeNode
];