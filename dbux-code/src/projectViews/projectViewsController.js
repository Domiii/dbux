import { commands, window, Uri, workspace } from 'vscode';
import fs from 'fs';
import { newLogger, addOutputStreams } from '@dbux/common/src/log/logger';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import ProjectNodeProvider from './practiceView/ProjectNodeProvider';
import SessionNodeProvider from './sessionView/SessionNodeProvider';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import OutputChannel from './OutputChannel';
import { getStopwatch } from './practiceStopwatch';
import { getProjectManager } from './projectControl';
import { initProjectCommands } from '../commands/projectCommands';
import { set as mementoSet, get as mementoGet, remove as mementoRemove } from '../memento';
import { showInformationMessage } from '../codeUtil/codeModals';
import { initCodeEvents } from '../practice/codeEvents';
import { translate } from '../lang';
import { getLogsDirectory } from '../codeUtil/codePath';
import { addProjectFolderToWorkspace, getDefaultWorkspaceFilePath, isProjectFolderInWorkspace, maybeCreateWorkspaceFile } from '../codeUtil/workspaceUtil';

/** @typedef {import('./practiceView/ExerciseNode').ExerciseNode} ExerciseNode */
/** @typedef {import('@dbux/projects/src/projectLib/Exercise').default} Exercise */

const ShowProjectViewKeyName = 'dbux.projectView.showing';
const ActivatingBugKeyName = 'dbux.projectView.activatingBug';

// ########################################
//  setup logger for project
// ########################################

const logger = newLogger('dbux-practice');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

const outputChannel = new OutputChannel('Dbux');

addOutputStreams({
  log: outputChannel.log.bind(outputChannel),
  warn: outputChannel.log.bind(outputChannel),
  error: outputChannel.log.bind(outputChannel),
  debug: outputChannel.log.bind(outputChannel)
}, true);

export function showOutputChannel() {
  outputChannel.show();
}

export class ProjectViewController {
  constructor(context) {
    this.manager = getProjectManager(context);

    // ########################################
    //  init treeView
    // ########################################
    this.isShowingTreeView = mementoGet(ShowProjectViewKeyName, true);
    commands.executeCommand('setContext', 'dbux.context.showPracticeViews', this.isShowingTreeView);
    commands.executeCommand('setContext', 'dbux.context.hasPracticeSession', !!this.manager.practiceSession);

    this.projectViewNodeProvider = new ProjectNodeProvider(context, this);
    this.sessionViewNodeProvider = new SessionNodeProvider(context, this);

    this.practiceStopwatch = getStopwatch();
    this.practiceStopwatch.onClick(context, async () => {
      await this.manager.stopPractice();
    });

    // ########################################
    //  listen on practice status changed
    // ########################################
    this.manager.onRunStatusChanged(this.handleStatusChanged.bind(this));
    this.manager.onBugStatusChanged(this.refresh.bind(this));
    this.manager.onPracticeSessionStateChanged(this.handlePracticeSessionStateChanged.bind(this));

    initCodeEvents(this.manager, context);

    this.maybeNotifyExistingPracticeSession();
  }

  async maybeNotifyExistingPracticeSession() {
    try {
      if (this.manager.practiceSession) {
        const { exercise: bug } = this.manager.practiceSession;
        await showInformationMessage(translate('projectView.existBug.message', { bug: bug.id }), {
          [translate('projectView.existBug.ok')]() { },
          [translate('projectView.existBug.giveUp')]: async () => {
            await this.manager.stopPractice();
          }
        });
      }
    }
    catch (err) {
      logError(err);
    }
  }

  get treeView() {
    return this.projectViewNodeProvider.treeView;
  }

  isShowingPraciceView() {
    return !this.manager.practiceSession;
  }

  async handleStatusChanged(status) {
    try {
      await commands.executeCommand('setContext', 'dbuxProjectView.context.isBusy', RunStatus.is.Busy(status));
      this.isShowingPraciceView() && this.projectViewNodeProvider.refreshIcon();
    }
    catch (err) {
      logError(err);
    }
  }

  refresh() {
    if (this.isShowingTreeView) {
      if (this.isShowingPraciceView()) {
        this.projectViewNodeProvider.refreshIcon();
      }
      else {
        this.sessionViewNodeProvider.refresh();
      }
    }
  }

  async initProject() {
    await runTaskWithProgressBar(async (progress) => {
      progress.report({ message: 'Initializing dbux-project...' });
      await this.manager.init();

      progress.report({ message: 'Recovering practice session...' });
      const previousActivatingExerciseId = mementoGet(ActivatingBugKeyName);
      const previousActivatingBug = this.manager.getOrCreateDefaultProjectList().getExerciseById(previousActivatingExerciseId);
      if (previousActivatingBug) {
        await mementoRemove(ActivatingBugKeyName);
        await this.startPractice(previousActivatingBug);
      }
      else if (await this.manager.tryRecoverPracticeSession()) {
        // projectManager.maybeAskForTestBug(projectManager.activeBug);
      }
    }, { cancellable: false });
  }

  // ###########################################################################
  // toggleTreeView
  // ###########################################################################

  async toggleTreeView() {
    if (this.isShowingTreeView) {
      if (!await this.confirmCancelPracticeSession()) {
        return;
      }
    }

    this.isShowingTreeView = !this.isShowingTreeView;
    if (this.isShowingTreeView) {
      await commands.executeCommand('setContext', 'dbux.context.hasPracticeSession', !!this.manager.practiceSession);
    }
    await commands.executeCommand('setContext', 'dbux.context.showPracticeViews', this.isShowingTreeView);
    await mementoSet(ShowProjectViewKeyName, this.isShowingTreeView);
    this.refresh();
  }

  async handlePracticeSessionStateChanged() {
    try {
      await commands.executeCommand('setContext', 'dbux.context.hasPracticeSession', !!this.manager.practiceSession);
      this.refresh();
    }
    catch (err) {
      logError(err);
    }
  }

  // ###########################################################################
  // practice session
  // ###########################################################################

  /**
   * @param {Exercise} exercise 
   */
  async startPractice(exercise) {
    if (this.manager.practiceSession) {
      if (!await this.confirmCancelPracticeSession()) {
        return;
      }
    }

    const { project } = exercise;
    const title = `Bug ${`"${exercise.label}"` || ''} (${exercise.id})`;
    await this.runProjectTask(title, async (report) => {
      if (!await this.maybeAskForOpenProjectWorkspace(project, exercise)) {
        return;
      }

      // TOTRANSLATE
      report({ message: 'Activating...' });
      await this.manager.startPractice(exercise);
    });
  }

  async loadPracticeSession() {
    const openFileDialogOptions = {
      // TOTRANSLATE
      title: 'Select a log file to read',
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Dbux Log File': ['dbuxlog']
      },
      defaultUri: Uri.file(getLogsDirectory())
    };
    const file = (await window.showOpenDialog(openFileDialogOptions))?.[0];
    if (file) {
      // TOTRANSLATE
      const title = 'Load practice log';
      const loaded = await this.runProjectTask(title, async (report) => {
        // TOTRANSLATE
        report({ message: 'Loading file....' });
        return await this.manager.loadPracticeSessionFromFile(file.fsPath);
      });
      if (loaded) {
        await showInformationMessage(`Log file ${file.fsPath} loaded`);
      }
    }
  }

  async testBug(inputCfg) {
    const { exercise: bug } = this.manager.practiceSession;
    const title = `Bug ${`"${bug.label}"` || ''} (${bug.id})`;
    await this.runProjectTask(title, async (report) => {
      // TOTRANSLATE
      report({ message: 'Running test...' });
      await this.manager.practiceSession.testExercise(inputCfg);
    });
  }

  /**
   * 
   * @param {string} title 
   * @param {taskCallback} task 
   * @param {boolean} cancellable 
   */
  async runProjectTask(title, task, cancellable = false) {
    showOutputChannel();
    return await runTaskWithProgressBar(async (progress) => {
      return await task(progress.report.bind(progress));
    }, { title, cancellable });
  }

  async confirmCancelPracticeSession() {
    return await this.manager.stopPractice();
  }

  /** ###########################################################################
   * lastWorkspacePath
   *  #########################################################################*/

  getLastWorkspaceKeyName(bug) {
    return `dbux.lastWorkspacePath.${bug.id}`;
  }

  /** ###########################################################################
   * util
   *  #########################################################################*/

  /**
   * @param {Project} project 
   * @param {Exercise} exercise 
   * @returns {Promise<boolean>}
   */
  async maybeAskForOpenProjectWorkspace(project, exercise) {
    if (isProjectFolderInWorkspace(project)) {
      return true;
    }

    const message = `Project "${project.name}" is currently not in your workspace (which makes it harder to work with it).`;

    const buttons = {};
    if (workspace.workspaceFolders !== undefined) {
      buttons["Add to current workspace"] = async () => {
        addProjectFolderToWorkspace(project);
        await mementoSet(this.getLastWorkspaceKeyName(exercise), workspace.workspaceFile?.fsPath);
        return true;
      };
    }
    const defaultProjectWorkspacePath = getDefaultWorkspaceFilePath(project);
    const openDefaultWorkspaceLabel = fs.existsSync(defaultProjectWorkspacePath) ?
      "Open workspace for project" :
      "Create + open new workspace for project";
    buttons[openDefaultWorkspaceLabel] = async () => {
      maybeCreateWorkspaceFile(project);
      await Promise.all([
        mementoSet(ActivatingBugKeyName, exercise.id),
        mementoSet(this.getLastWorkspaceKeyName(exercise), defaultProjectWorkspacePath)
      ]);
      await commands.executeCommand('vscode.openFolder', Uri.file(defaultProjectWorkspacePath));
      // return false to stop processing, session will be recoverd after workspace is opend
      return false;
    };
    const lastWorkspacePath = mementoGet(this.getLastWorkspaceKeyName(exercise));
    if (lastWorkspacePath && fs.existsSync(lastWorkspacePath) && lastWorkspacePath !== workspace.workspaceFile?.fsPath) {
      buttons["Open last workspace"] = async () => {
        await mementoSet(ActivatingBugKeyName, exercise.id);
        await commands.executeCommand('vscode.openFolder', Uri.file(lastWorkspacePath));
      };
    }
    buttons.Continue = () => {
      return true;
    };
    const result = await showInformationMessage(message, buttons, { modal: true });
    return result;
  }
}

// ###########################################################################
// init/dispose
// ###########################################################################

/**
 * @type {ProjectViewController}
 */
let controller;

export function initProjectView(context) {
  if (!controller) {
    controller = new ProjectViewController(context);

    // shut it all down when VSCode shuts down
    context.subscriptions.push({
      dispose() {
        controller.manager.stopRunner();
      }
    });

    // refresh right away
    controller.projectViewNodeProvider.refresh();
    controller.sessionViewNodeProvider.refresh();

    // register commands
    initProjectCommands(context, controller);
  }

  return controller;
}