import { registerCommand } from '../commands/commandUtil';

export function initTraceDetailsCommands(context) {
  registerCommand(context,
    'dbuxTraceDetailsView.itemClick',
    (node: ContextNode) => node._handleClick()
  );
}