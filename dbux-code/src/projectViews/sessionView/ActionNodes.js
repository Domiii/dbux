import traceSelection from '@dbux/data/src/traceSelection';
import PracticeSessionState from '@dbux/projects/src/practiceSession/PracticeSessionState';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import { showInformationMessage, showWarningMessage } from '../../codeUtil/codeModals';
import { emitTagTraceAction } from '../../userEvents';
import { getCursorLocation } from '../../codeUtil/codeNav';
import { codeLineToBabelLine } from '../../helpers/codeLocHelpers';
import { isProjectFolderInWorkspace } from '../../codeUtil/workspaceUtil';

/** @typedef {import('../projectViewsController').default} ProjectViewsController */
/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */
/** @typedef {import('@dbux/projects/src/projectLib/Exercise').default} Exercise */

/** ###########################################################################
 * {@link SessionNode}
 *  #########################################################################*/

class SessionNode extends BaseTreeViewNode {
  availableOnBusy = false;

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
   * @return {Exercise}
   */
  get exercise() {
    return this.entry;
  }

  async handleClick() {
    if (!this.availableOnBusy && this.manager.isBusy()) {
      // TOTRANSLATE
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

/** ###########################################################################
 * {@link DetailNode}
 *  #########################################################################*/
class DetailNode extends SessionNode {
  /**
   * @param {Exercise} exercise 
   */
  static makeLabel(exercise) {
    const state = exercise.manager.practiceSession?.state;
    return `${PracticeSessionState.getName(state)}: ${exercise.label}`;
  }

  init() {
    this.tooltip = 'Click for more information on current exercise.';
    this.contextValue = 'dbuxSessionView.detailNode';
    this.description = this.exercise.id;
    this.availableOnBusy = true;
  }

  makeIconPath() {
    return 'question.svg';
  }

  async doHandleClick() {
    await this.exercise.manager.externals.showExerciseIntroduction(this.exercise);
  }
}

/** ###########################################################################
 * {@link ShowEntryNode}
 * ##########################################################################*/

class ShowEntryNode extends SessionNode {
  static makeLabel() {
    return 'Go to program entry point';
  }

  init() {
    this.contextValue = 'dbuxSessionView.showEntryNode';
    this.availableOnBusy = true;
  }

  makeIconPath() {
    return 'document.svg';
  }

  async doHandleClick() {
    const success = await this.entry.openInEditor();
    !success && await showInformationMessage(`No entry file of this exercise.`);
  }
}

/** ###########################################################################
 * {@link OpenWorkspaceNode}
 * ##########################################################################*/

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
    !success && await showInformationMessage(`No entry file of this exercise.`);
  }
}

/** ###########################################################################
 * {@link RunNode}
 * ##########################################################################*/

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
    return await this.exercise.project.flushCacheConfirm();
  }
}

/** ###########################################################################
 * {@link RunWithoutDbuxNode}
 * ##########################################################################*/

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

/** ###########################################################################
 * {@link TagNode}
 * ##########################################################################*/

class TagNode extends SessionNode {
  static makeLabel() {
    return 'Solve: Mark selected trace\'s line as buggy!';
  }

  init() {
    this.tooltip = 'Mark current trace as bug location.';
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
      this.manager.practiceSession.tagExerciseTrace(trace, cursorFile, cursorLine);
    }
    else {
      await showWarningMessage('You have not selected any trace yet.');
    }
  }
}


/** ###########################################################################
 * {@link StopPracticeNode}
 *  #########################################################################*/

class StopPracticeNode extends SessionNode {
  static makeLabel(exercise) {
    if (exercise.manager.practiceSession.isFinished()) {
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
      await this.manager.exitPracticeSession();
    }
  }
}

export function getActionNodeClasses(exercise) {
  if (exercise) {
    const { project } = exercise;
    return [
      DetailNode,
      isProjectFolderInWorkspace(project) ? ShowEntryNode : OpenWorkspaceNode,
      RunNode,
      RunWithoutDbuxNode,
      TagNode,
      StopPracticeNode
    ];
  }
  else {
    return [
      TagNode,
      StopPracticeNode,
    ];
  }
}