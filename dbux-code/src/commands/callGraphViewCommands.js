import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { CallGraphViewController } from '../callGraphView/callGraphViewController';
import CallRootNode from '../callGraphView/CallRootNode';

const { log, debug, warn, error: logError } = newLogger('Commands');

/**
 * 
 * @param {CallGraphViewController} callGraphViewController 
 */
export function initCallGraphViewCommands(context, callGraphViewController) {
  registerCommand(context,
    'dbuxCallGraphView.gotoEntry',
    (node: CallRootNode) => callGraphViewController.handleItemClick(node)
  );

  registerCommand(context,
    'dbuxCallGraphView.itemClick',
    (node: CallRootNode) => callGraphViewController.handleItemClick(node)
  );
}