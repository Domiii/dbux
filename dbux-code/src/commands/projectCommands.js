import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { registerCommand } from './commandUtil';
import { showInformationMessage } from '../codeUtil/codeModals';

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

  registerCommand(extensionContext, 'dbuxProjectView.node.addProjectToWorkspace', (node) => {
    return projectViewController.nodeAddToWorkspace(node);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.deleteProject', (node) => {
    return node.deleteProject();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.stopProject', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.activateBug', (node) => {
    return projectViewController.startPractice(node);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.busyIcon', (/* node */) => {
    return window.showInformationMessage('[dbux] busy now...');
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
}