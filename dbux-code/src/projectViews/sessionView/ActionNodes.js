import traceSelection from '@dbux/data/src/traceSelection';
import PracticeSessionState from '@dbux/projects/src/practiceSession/PracticeSessionState';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { showInformationMessage, showWarningMessage } from '../../codeUtil/codeModals';
import { emitTagTraceAction } from '../../userEvents';
import { getCursorLocation } from '../../codeUtil/codeNav';
import { codeLineToBabelLine } from '../../helpers/codeLocHelpers';
import { isProjectFolderInWorkspace } from '../../codeUtil/workspaceUtil';

/** @typedef {import('../projectViewsController').default} ProjectViewsController */
/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */
/** @typedef {import('@dbux/projects/src/projectLib/Exercise').default} Bug */

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

  async handleClick() {
    if (this.manager.isBusy()) {
      await showInformationMessage('Currently busy, please wait');
    }
    else {
      await this.doHandleClick?.();
    }
  }

  /**
   * @virtual
   */
  async doHandleClick() { }
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

  async doHandleClick() {
    await this.bug.manager.externals.showBugIntroduction(this.bug);
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

  async doHandleClick() {
    const success = await this.entry.openInEditor();
    !success && await showInformationMessage(`No entry file of this bug.`);
  }
}

class OpenWorkspaceNode extends SessionNode {
  static makeLabel() {
    return 'Open VSCode workspace';
  }

  init() {
    this.contextValue = 'dbuxSessionView.openWorkspaceNode';
  }

  makeIconPath() {
    return 'workspace.svg';
  }

  async doHandleClick() {
    const { project } = this.entry;
    await this.controller.askForOpenProjectWorkspace(project);
  }

  async showEntry() {
    const success = await this.entry.openInEditor();
    !success && await showInformationMessage(`No entry file of this bug.`);
  }
}

class RunNode extends SessionNode {
  static makeLabel() {
    return 'Run';
  }

  get clickCommandName() {
    return 'dbuxSessionView.run#dbux';
  }

  init() {
    this.contextValue = 'dbuxSessionView.runNode#dbux';
  }

  makeIconPath() {
    return 'play.svg';
  }

  async flushCache() {
    return await this.bug.project.flushCacheConfirm();
  }
}

class RunWithoutDbuxNode extends SessionNode {
  static makeLabel() {
    return 'Run without Dbux';
  }

  init() {
    this.contextValue = 'dbuxSessionView.runNode';
  }

  makeIconPath() {
    return 'play_gray.svg';
  }

  get clickCommandName() {
    return 'dbuxSessionView.run';
  }
}

class TagNode extends SessionNode {
  get clickUserActionType() {
    return false;
  }

  static makeLabel() {
    return 'The bug is in the selected trace\'s line!';
  }

  init() {
    this.tooltip = 'Tag current trace as bug location';
    this.contextValue = 'dbuxSessionView.tagNode';
  }

  makeIconPath() {
    return 'flag.svg';
  }

  async doHandleClick() {
    const trace = traceSelection.selected;
    if (trace) {
      emitTagTraceAction(trace);
      const cursorLoc = getCursorLocation();
      const cursorLine = codeLineToBabelLine(cursorLoc?.pos.line);
      const cursorFile = cursorLoc?.fpath;
      this.manager.practiceSession.tagBugTrace(trace, cursorFile, cursorLine);
    }
    else {
      await showWarningMessage('You have not selected any trace yet.');
    }
  }
}

class StopPracticeNode extends SessionNode {
  static makeLabel(bug) {
    if (bug.manager.practiceSession.isFinished()) {
      return 'Exit Session';
    }
    else {
      return 'Stop Practice';
    }
  }

  init() {
    this.contextValue = 'dbuxSessionView.stopPracticeNode';
  }

  makeIconPath() {
    return 'quit.svg';
  }

  async doHandleClick() {
    if (!this.manager.practiceSession.isFinished()) {
      await this.manager.practiceSession.confirmStop();
    }
    else {
      await this.manager.practiceSession.confirmExit();
    }
  }
}

export function getActionNodeClasses(bug) {
  const { project } = bug;
  return [
    DetailNode,
    isProjectFolderInWorkspace(project) ? ShowEntryNode : OpenWorkspaceNode,
    RunNode,
    RunWithoutDbuxNode,
    TagNode,
    StopPracticeNode
  ];
}