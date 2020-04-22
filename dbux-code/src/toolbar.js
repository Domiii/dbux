import { commands } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commands/commandUtil';

const { log, debug, warn, error: logError } = newLogger('Toolbar');

export function initToolBar(context) {
  commands.executeCommand('setContext', 'dbux.context.showNavButton', true);

  registerCommand(context,
    'dbux.showNavButton',
    () => commands.executeCommand('setContext', 'dbux.context.showNavButton', true)
  );

  registerCommand(context,
    'dbux.hideNavButton',
    () => commands.executeCommand('setContext', 'dbux.context.showNavButton', false)
  );
}