import { window } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { TreeViewController } from '../treeView/treeViewController';
import ContextNode from '../treeView/ContextNode';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initTreeViewCommands(context, treeViewController: TreeViewController) {
  registerCommand(context,
    'dbuxContextView.deleteEntry',
    (node: ContextNode) => window.showInformationMessage(`Clicked on delete entry with node = ${node.label}.`)
  );

  registerCommand(context,
    'dbuxContextView.gotoEntry',
    (node: ContextNode) => node.gotoCode()
  );

  registerCommand(context,
    'dbuxContextView.itemClick',
    (node: ContextNode) => treeViewController.nodeOnClick(node)
  );
}