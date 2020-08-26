import { newLogger } from '@dbux/common/src/log/logger';
import { registerCommand } from './commandUtil';
import { showTextDocument } from '../codeUtil/codeNav';
import { initRuntimeServer, stopRuntimeServer } from '../net/SocketServer';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Commands');

export function initApplicationsViewCommands(context) {
  registerCommand(context,
    'dbux.startRuntimeServer',
    () => initRuntimeServer(context)
  );

  registerCommand(context,
    'dbux.stopRuntimeServer',
    stopRuntimeServer
  );

  registerCommand(context,
    'dbuxApplicationsView.showEntryPoint',
    (node) => showTextDocument(node.application.entryPointPath)
  );
}