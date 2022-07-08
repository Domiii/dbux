import path from 'path';
import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { registerCommand } from './commandUtil';
import { chooseFile, showInformationMessage, showWarningMessage } from '../codeUtil/codeModals';
import { getCurrentResearch } from '../research/Research';
import { translate } from '../lang';
import { emitAnnotateTraceAction, emitStopRunnerAction } from '../userEvents';
import { addProjectFolderToWorkspace } from '../codeUtil/workspaceUtil';

/** @typedef {import('../projectViews/projectViewsController').ProjectViewController} ProjectViewController */

const logger = newLogger('projectCommands');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

/**
 * @param {ProjectViewController} projectViewController 
 */
export function initProjectCommands(extensionContext, projectViewController) {
  /** ###########################################################################
   * user command
   *  #########################################################################*/

  registerCommand(extensionContext, 'dbux.loadPracticeLogFile', async () => {
    await projectViewController.loadPracticeSession();
  });

  registerCommand(extensionContext, 'dbux.reloadExerciseList', async () => {
    const { manager } = projectViewController;
    if (await manager.exitPracticeSession()) {
      manager.reloadExercises();
      projectViewController.refresh();
    }
  });

  registerCommand(extensionContext, 'dbuxProject.uploadLog', async (/* node */) => {
    return projectViewController.manager.uploadLog();
  });

  registerCommand(extensionContext, 'dbux.cancelBugRunner', async (/* node */) => {
    await projectViewController.manager.runner.cancel();
    emitStopRunnerAction();
  });

  registerCommand(extensionContext, 'dbux.resetPracticeLog', async () => {
    await projectViewController.manager.resetLog();
    projectViewController.projectViewNodeProvider.refreshIcon();
    await showInformationMessage('Practice log cleared');
  });

  registerCommand(extensionContext, 'dbux.resetPracticeProgress', async () => {
    await projectViewController.manager.resetProgress();
    projectViewController.projectViewNodeProvider.refreshIcon();
    await showInformationMessage('Exercise progress cleared');
  });

  registerCommand(extensionContext, 'dbux.togglePracticeView', async () => {
    await projectViewController.toggleTreeView();
  });

  registerCommand(extensionContext, 'dbux.startPathways', async () => {
    await projectViewController.manager.startPractice();
    await showInformationMessage('Start recording user actions.');
  });

  registerCommand(extensionContext, 'dbux.stopPathways', async () => {
    return await projectViewController.manager.exitPracticeSession();
  });

  registerCommand(extensionContext, 'dbux.loadResearchSession', async () => {
    const researchEnabled = process.env.RESEARCH_ENABLED;
    if (!researchEnabled) {
      await showWarningMessage('Research is not enabled.');
      return;
    }

    const researchDataFolder = getCurrentResearch().getDataRootLfs();

    // TOTRANSLATE
    const fileDialogOptions = {
      title: 'Select a research session to read',
      folder: researchDataFolder,
      filters: {
        'Dbux Research Data': ['dbuxapp.zip']
      },
    };
    const filePath = await chooseFile(fileDialogOptions);

    if (filePath) {
      const exerciseId = path.basename(filePath, '.dbuxapp.zip');
      const exercise = projectViewController.manager.getExerciseById(exerciseId);
      if (!exercise) {
        throw new Error(`Cannot find exercise of id ${exerciseId}`);
      }

      // TOTRANSLATE
      const title = 'Load research session';
      const loaded = await projectViewController.runProjectTask(title, async (report) => {
        // TOTRANSLATE
        report({ message: 'Loading file....' });
        return await projectViewController.manager.loadResearchSession(exerciseId);
      });
      if (loaded) {
        await showInformationMessage(`Research session for exercise ${exerciseId} loaded`);
      }
    }
  });

  /** ###########################################################################
   * project view
   *  #########################################################################*/

  registerCommand(extensionContext, 'dbuxProjectView.toggleListMode', (/* node */) => {
    projectViewController.projectViewNodeProvider.toggleListMode();
  });

  registerCommand(extensionContext, 'dbuxProjectView.showDiff', (/* node */) => {
    return showInformationMessage(`You may click 'Source Control' button to review your change.`);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.addProjectToWorkspace', (node) => {
    return addProjectFolderToWorkspace(node.project);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.cleanup', (node) => {
    return node.cleanUp();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.exerciseCleanup', (node) => {
    return node.cleanUp();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.stopProject', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.startPractice', (exerciseNode) => {
    return projectViewController.startPractice(exerciseNode.exercise);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.busyIcon', (/* node */) => {
    return showInformationMessage(translate('busyNow')); // how to triggger this
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.stopRunner', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.resetExercise', async (node) => {
    await node.tryResetExercise();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.showWebsite', (node) => {
    return node.showWebsite?.();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.showExerciseIntroduction', async (node) => {
    await node.showExerciseIntroduction();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.showExerciseLog', async (node) => {
    await node.showExerciseLog();
  });

  /** ###########################################################################
   * session view
   *  #########################################################################*/

  registerCommand(extensionContext, 'dbuxSessionView.run', async () => {
    return await projectViewController.testBug({ debugMode: false, dbuxEnabled: false });
  });

  registerCommand(extensionContext, 'dbuxSessionView.run#debug', async () => {
    return await projectViewController.testBug({ debugMode: true, dbuxEnabled: false });
  });

  registerCommand(extensionContext, 'dbuxSessionView.run#dbux', async () => {
    return await projectViewController.testBug({ debugMode: false, dbuxEnabled: true });
  });

  registerCommand(extensionContext, 'dbuxSessionView.run#debug#dbux', async () => {
    return await projectViewController.testBug({ debugMode: true, dbuxEnabled: true });
  });

  registerCommand(extensionContext, 'dbuxSessionView.flushCache', async () => {
    const session = projectViewController.manager.practiceSession;
    if (!session) {
      await showInformationMessage(`No practice session activated.`);
    }
    else {
      const { project } = session;
      await project.flushCacheConfirm();
    }
  });

  registerCommand(extensionContext, 'dbuxSessionView.node.annotateTraceQ', async (node) => {
    if (!traceSelection.selected) {
      await showWarningMessage('You have not selected any trace yet.');
      return;
    }

    const session = node.bug.manager.practiceSession;
    const annotation = await window.showInputBox({ value: session.lastAnnotation });
    if (annotation) {
      session.lastAnnotation = annotation;
      emitAnnotateTraceAction(UserActionType.AnnotateTraceQ, traceSelection.selected, annotation);
    }
  });

  registerCommand(extensionContext, 'dbuxSessionView.node.annotateTraceI', async (node) => {
    if (!traceSelection.selected) {
      await showWarningMessage('You have not selected any trace yet.');
      return;
    }

    const session = node.bug.manager.practiceSession;
    const annotation = await window.showInputBox({ value: session.lastAnnotation });
    if (annotation) {
      session.lastAnnotation = annotation;
      emitAnnotateTraceAction(UserActionType.AnnotateTraceI, traceSelection.selected, annotation);
    }
  });

  registerCommand(extensionContext, 'dbuxSessionView.node.showEntryFile', async (node) => {
    return await node.showEntry();
  });
}
