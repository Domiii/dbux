import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { registerCommand } from './commandUtil';
import { showTextDocument } from '../codeUtil/codeNav';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initApplicationsViewCommands(context) {
  registerCommand(context,
    'dbuxApplicationsView.showEntryPoint',
    (node) => showTextDocument(node.application.entryPointPath)
  );
}