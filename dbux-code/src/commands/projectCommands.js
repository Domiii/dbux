import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { ProjectsManager } from '@dbux/projects/src';
import { registerCommand } from './commandUtil';

const logger = newLogger('projectCommands');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

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

  registerCommand(extensionContext, 'dbuxProjectView.node.activateBugWithDebugger', (node) => {
    return projectViewController.activateBugByNode(node, true);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.activateBug', (node) => {
    return projectViewController.activateBugByNode(node);
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
  
  registerCommand(extensionContext, 'dbux.cancelBugRunner', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });
}