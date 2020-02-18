import { registerCommand } from './commandUtil';
import CallStackNode from '../callStackView/CallStackNode';

/**
 * @param {CallStackNode} callStackViewController 
 */
export function initCallStackViewCommands(context, callStackViewController) {
  registerCommand(context,
    'dbuxCallStackView.gotoEntry',
    (node: CallStackNode) => callStackViewController.handleItemClick(node)
  );

  registerCommand(context,
    'dbuxCallStackView.itemClick',
    (node: CallStackNode) => callStackViewController.handleItemClick(node)
  );
}