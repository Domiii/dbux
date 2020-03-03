import { registerCommand } from './commandUtil';
import CallStackNode from '../callStackView/CallStackNode';

/**
 * @param {CallStackNode} callStackViewController 
 */
export default function initCallStackViewCommands(context, callStackViewController) {
  registerCommand(context,
    'dbuxCallStackView.itemClick',
    (node: CallStackNode) => callStackViewController.handleItemClick(node)
  );
  registerCommand(context,
    'dbuxCallStackView.showParent',
    (node: CallStackNode) => callStackViewController.showParent(node)
  );
  registerCommand(context,
    'dbuxCallStackView.showScheduler',
    (node: CallStackNode) => callStackViewController.showScheduler(node)
  );
}