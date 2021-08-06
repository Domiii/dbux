import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { registerCommand } from './commandUtil';
import { showInformationMessage, showWarningMessage } from '../codeUtil/codeModals';
import { translate } from '../lang';
import { emitAnnotateTraceAction } from '../userEvents';
import { addProjectFolderToWorkspace } from '../codeUtil/workspaceUtil';

/** @typedef {import('../projectViews/projectViewsController').ProjectViewController} ProjectViewController */

const logger = newLogger('projectCommands');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

/**
 * @param {ProjectViewController} projectViewController 
 */
export function initProjectCommands(extensionContext, projectViewController) {
  registerCommand(extensionContext, 'dbuxProjectView.showDiff', (/* node */) => {
    return projectViewController.manager.externals.showMessage.info(`You may click 'Source Control' button to review your change.`);
  });

  registerCommand(extensionContext, 'dbuxProject.uploadLog', async (/* node */) => {
    return projectViewController.manager.uploadLog();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.addProjectToWorkspace', (node) => {
    return addProjectFolderToWorkspace(node.project);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.deleteProject', (node) => {
    return node.deleteProject();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.stopProject', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.startPractice', (node) => {
    return projectViewController.startPractice(node);
  });

  registerCommand(extensionContext, 'dbux.loadPracticeLogFile', async () => {
    await projectViewController.loadPracticeSession();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.busyIcon', (/* node */) => {
    return showInformationMessage(translate('busyNow')); // how to triggger this
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.stopBug', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.resetBug', async (node) => {
    await node.tryResetBug();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.showWebsite', (node) => {
    return node.showWebsite?.();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.showBugIntroduction', async (node) => {
    await node.showBugIntroduction();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.showBugLog', async (node) => {
    await node.showBugLog();
  });

  registerCommand(extensionContext, 'dbux.cancelBugRunner', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });

  registerCommand(extensionContext, 'dbux.resetPracticeLog', async () => {
    await projectViewController.manager.resetLog();
    projectViewController.projectViewNodeProvider.refreshIcon();
    await showInformationMessage('Practice log cleared');
  });

  registerCommand(extensionContext, 'dbux.resetPracticeProgress', async () => {
    await projectViewController.manager.resetProgress();
    projectViewController.projectViewNodeProvider.refreshIcon();
    await showInformationMessage('Bug progress cleared');
  });

  registerCommand(extensionContext, 'dbux.togglePracticeView', async () => {
    await projectViewController.toggleTreeView();
  });

  registerCommand(extensionContext, 'dbux.showDBStats', () => {
    projectViewController.manager._backend.showDBStats();
  });

  registerCommand(extensionContext, 'dbux.clearDBStats', async () => {
    projectViewController.manager._backend.clearDBStats();
  });

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
      await projectViewController.manager.flushCache(project);
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