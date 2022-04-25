import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import { registerCommand } from './commandUtil';
import { showTextDocument } from '../codeUtil/codeNav';
import { initRuntimeServer, stopRuntimeServer } from '../net/SocketServer';
import { emitShowApplicationEntryFileAction } from '../userEvents';
import { getProjectManager } from '../projectViews/projectControl';

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
    'dbuxApplicationsView.clearApplication',
    () => {
      allApplications.clear();
      getProjectManager().practiceSession?.pdp.reset();
    }
  );

  registerCommand(context,
    'dbuxApplicationsView.showEntryPoint',
    async (node) => {
      const filePath = node.application.entryPointPath;
      await showTextDocument(filePath);
      emitShowApplicationEntryFileAction(filePath);
    }
  );
}