import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { TreeViewController } from '../treeView/treeViewController';
import ContextNode from '../treeView/ContextNode';

import {
  window
} from 'vscode';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initTreeViewCommands(context, treeViewController: TreeViewController){
  
  registerCommand(context,
    'dbuxView.deleteEntry',
    (node: ContextNode) => window.showInformationMessage(`Clicked on delete entry with node = ${node.label}.`)
  );

  registerCommand(context,
    'dbuxView.gotoEntry',
    (node: ContextNode) => node.gotoCode()
  );

  registerCommand(context,
    'dbuxView.itemClick',
    (node: ContextNode) => treeViewController.nodeOnClick(node)
  );

}