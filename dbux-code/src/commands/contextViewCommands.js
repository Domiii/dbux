import { window } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { ContextViewController } from '../contextView/contextViewController';
import ContextNode from '../contextView/ContextNode';

const { log, debug, warn, error: logError } = newLogger('Commands');

/**
 * 
 * @param {ContextViewController} contextViewController 
 */
export default function initContextViewCommands(context, contextViewController) {
  registerCommand(context,
    'dbuxContextView.gotoEntry',
    (node: ContextNode) => contextViewController.handleItemClick(node)
  );

  registerCommand(context,
    'dbuxContextView.itemClick',
    (node: ContextNode) => contextViewController.handleItemClick(node)
  );
}