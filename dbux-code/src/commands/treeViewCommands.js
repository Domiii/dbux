import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { getOrCreateTreeViewController } from '../treeView/treeViewController';
import ContextNode from '../treeView/ContextNode';

import {
  window
} from 'vscode';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initTreeViewCommands(context){

  const treeViewController = getOrCreateTreeViewController();
  
  registerCommand(context,
    'dbuxEvents.deleteEntry',
    (node) => window.showInformationMessage(`Clicked on delete entry with node = ${node.label}.`)
  );

  registerCommand(context,
    'dbuxEvents.gotoEntry',
    (node: ContextNode) => node.gotoCode()
  );

  registerCommand(context,
    'dbuxEvents.itemClick',
    (node: ContextNode) => treeViewController.nodeOnClick(node)
  );

}