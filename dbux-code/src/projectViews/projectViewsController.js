import { commands, window, Uri, workspace } from 'vscode';
import fs from 'fs';
import { newLogger } from '@dbux/common/src/log/logger';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import ProjectNodeProvider from './practiceView/ProjectNodeProvider';
import SessionNodeProvider from './sessionView/SessionNodeProvider';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import { showOutputChannel } from '../OutputChannel';
import { getStopwatch } from './practiceStopwatch';
import { getProjectManager } from './projectControl';
import { initProjectCommands } from '../commands/projectCommands';
import { set as mementoSet, get as mementoGet, remove as mementoRemove } from '../memento';
import { chooseFile, showInformationMessage } from '../codeUtil/codeModals';
import { initCodeEvents } from '../practice/codeEvents';
import { translate } from '../lang';
import { getLogsDirectory } from '../codeUtil/codePath';
import { addProjectFolderToWorkspace, getDefaultWorkspaceFilePath, isProjectFolderInWorkspace, maybeCreateWorkspaceFile } from '../codeUtil/workspaceUtil';
import { emitShowHideProjectViewsAction } from '../userEvents';

/** @typedef {import('./practiceView/ExerciseNode').ExerciseNode} ExerciseNode */
/** @typedef {import('@dbux/projects/src/projectLib/Exercise').default} Exercise */

const ShowProjectViewKeyName = 'dbux.projectView.showing';
const ActivatingExerciseKeyName = 'dbux.projectView.activatingExercise';

// ########################################
//  setup logger for project
// ########################################

const logger = newLogger('dbux-practice');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

// future-work: remove from here. Make everyone import from `OutputChannel` instead.
export {
  showOutputChannel
};

export class ProjectViewController {
  constructor(context) {
    this.context = context;
    this.manager = getProjectManager(context);

    // ########################################
    //  init treeView
    // ########################################
    this.isShowingTreeView = mementoGet(ShowProjectViewKeyName, true);
    commands.executeCommand('setContext', 'dbux.context.showPracticeViews', this.isShowingTreeView);
    commands.executeCommand('setContext', 'dbux.context.hasPracticeSession', !!this.manager.practiceSession);
  }

  async maybeNotifyExistingPracticeSession() {
    try {
      if (this.manager.practiceSession) {
        const { exercise: bug } = this.manager.practiceSession;
        await showInformationMessage(translate('projectView.existBug.message', { bug: bug.id }), {
          [translate('projectView.existBug.ok')]() { },
          [translate('projectView.existBug.giveUp')]: async () => {
            await this.manager.exitPracticeSession();
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

  handleStatusChanged = async (status) => {
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
        this.projectViewNodeProvider.refresh();
      }
      else {
        this.sessionViewNodeProvider.refresh();
      }
    }
  }

  /** ###########################################################################
   * init
   *  #########################################################################*/

  async doInitWork() {
    await runTaskWithProgressBar(async (progress) => {
      progress.report({ message: 'Initializing dbux-projects...' });
      await this.manager.init();

      // init work
      const { context } = this;
      this.projectViewNodeProvider = new ProjectNodeProvider(context, this);
      this.sessionViewNodeProvider = new SessionNodeProvider(context, this);

      this.practiceStopwatch = getStopwatch();
      this.practiceStopwatch.onClick(context, async () => {
        await this.manager.exitPracticeSession();
      });

      // ########################################
      //  listen on practice status changed
      // ########################################
      this.manager.onRunStatusChanged(this.handleStatusChanged);
      this.manager.onBugStatusChanged(this.handleStatusChanged);
      this.manager.onPracticeSessionStateChanged(this.handlePracticeSessionStateChanged.bind(this));

      initCodeEvents(this.manager, context);

      this.maybeNotifyExistingPracticeSession();

      const previousActivatingExerciseId = mementoGet(ActivatingExerciseKeyName);
      const previousActivatingExercise = this.manager.getExerciseById(previousActivatingExerciseId);
      if (previousActivatingExercise) {
        // continute the activation process
        progress.report({ message: 'Continuing the activation process...' });
        await mementoRemove(ActivatingExerciseKeyName);
        await this.startPractice(previousActivatingExercise);
      }
      else {
        // recover old practice session
        progress.report({ message: 'Recovering practice session...' });
        await this.manager.tryRecoverPracticeSession();
      }

      this.refresh();
    }, { cancellable: false });
  }

  // ###########################################################################
  // toggleTreeView
  // ###########################################################################

  async toggleTreeView() {
    if (this.isShowingTreeView) {
      if (!await this.manager.exitPracticeSession()) {
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
    emitShowHideProjectViewsAction(this.isShowingTreeView);
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
    if (!await this.manager.exitPracticeSession()) {
      return;
    }

    const { project } = exercise;
    const title = `Exercise ${`"${exercise.label}"` || ''} (${exercise.id})`;
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
    // TOTRANSLATE
    const fileDialogOptions = {
      title: 'Select a log file to read',
      folder: getLogsDirectory(),
      filters: {
        'Dbux Log File': ['dbuxlog']
      },
    };
    const filePath = await chooseFile(fileDialogOptions);

    if (filePath) {
      // TOTRANSLATE
      const title = 'Load practice log';
      const loaded = await this.runProjectTask(title, async (report) => {
        // TOTRANSLATE
        report({ message: 'Loading file....' });
        return await this.manager.loadPracticeSessionFromFile(filePath);
      });
      if (loaded) {
        await showInformationMessage(`Log file ${filePath} loaded`);
      }
    }
  }

  async testBug(inputCfg) {
    const { exercise } = this.manager.practiceSession;
    const title = `Exercise ${`"${exercise.label}"` || ''} (${exercise.id})`;
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
    debug(`Open workspaceFolders: ${workspace.workspaceFolders?.map(f => f.uri.fsPath).join(',')}`);

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
      // NOTE: `openWorkspace` reloads the window immediately, we check the key `ActivatingExerciseKeyName` on start to continue the activation process
      await Promise.all([
        mementoSet(ActivatingExerciseKeyName, exercise.id),
        mementoSet(this.getLastWorkspaceKeyName(exercise), defaultProjectWorkspacePath)
      ]);
      await commands.executeCommand('vscode.openFolder', Uri.file(defaultProjectWorkspacePath));
      // return false to stop processing, session will be recoverd after workspace is opend
      return false;
    };
    const lastWorkspacePath = mementoGet(this.getLastWorkspaceKeyName(exercise));
    if (lastWorkspacePath && fs.existsSync(lastWorkspacePath) && lastWorkspacePath !== workspace.workspaceFile?.fsPath) {
      buttons["Open last workspace"] = async () => {
        await mementoSet(ActivatingExerciseKeyName, exercise.id);
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

/** ###########################################################################
 * {@link initProjectView}
 *  #########################################################################*/

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

    // register commands
    initProjectCommands(context, controller);
  }

  return controller;
}

export function getProjectViewController() {
  return controller;
}
