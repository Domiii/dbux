import { registerCommand } from '../commands/commandUtil';

export function initTraceDetailsCommands(context) {
  registerCommand(context,
    'dbuxTraceDetailsView.itemClick',
    (treeDetailsDataProvider, node) => treeDetailsDataProvider._handleClick(node)
  );
}