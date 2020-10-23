import traceSelection from '@dbux/data/src/traceSelection';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import PracticeSessionState from '@dbux/projects/src/practiceSession/PracticeSessionState';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { showInformationMessage, showWarningMessage } from '../../codeUtil/codeModals';
import { emitTagTraceAction } from '../../userEvents';

/** @typedef {import('../projectViewsController').default} ProjectViewsController */
/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */
/** @typedef {import('@dbux/projects/src/projectLib/Bug').default} Bug */

class SessionNode extends BaseTreeViewNode {
  /**
   * @return {ProjectViewsController}
   */
  get controller() {
    return this.treeNodeProvider.controller;
  }

  /**
   * @return {ProjectsManager}
   */
  get manager() {
    return this.treeNodeProvider.manager;
  }

  /**
   * @return {Bug}
   */
  get bug() {
    return this.entry;
  }
}

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

  makeIconPath() {
    return 'project.svg';
  }
}

class ShowEntryNode extends SessionNode {
  static makeLabel() {
    return 'Go to program entry point';
  }

  init() {
    this.contextValue = 'dbuxSessionView.showEntryNode';
  }

  makeIconPath() {
    return 'document.svg';
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

class RunNode extends SessionNode {
  static makeLabel() {
    return 'Run';
  }

  init() {
    this.contextValue = 'dbuxSessionView.runNode';
  }

  makeIconPath() {
    return 'play.svg';
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

class RunWithoutDbuxNode extends SessionNode {
  static makeLabel() {
    return 'Run without Dbux';
  }

  init() {
    this.contextValue = 'dbuxSessionView.runWithoutDbuxNode';
  }

  makeIconPath() {
    return 'play_gray.svg';
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

class DebugWithoutDbuxNode extends SessionNode {
  static makeLabel() {
    return 'Debug without Dbux';
  }

  init() {
    this.contextValue = 'dbuxSessionView.debugNode';
  }

  makeIconPath() {
    return 'bug_gray.svg';
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

class TagNode extends SessionNode {
  get clickUserActionType() {
    return false;
  }

  static makeLabel() {
    return 'I found it! (tag this trace)';
  }

  init() {
    this.tooltip = 'Tag current trace as bug location';
    this.contextValue = 'dbuxSessionView.tagNode';
  }

  makeIconPath() {
    return 'flag.svg';
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

class StopPracticeNode extends SessionNode {
  static makeLabel() {
    return 'Stop Practice';
  }

  init() {
    this.contextValue = 'dbuxSessionView.stopPracticeNode';
  }

  makeIconPath() {
    return 'quit.svg';
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