import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import { confirm } from '../codeUtil/codeModals';
import { showTextDocument } from '../codeUtil/codeNav';
import { initRuntimeServer, stopRuntimeServer } from '../net/SocketServer';
import { emitShowApplicationEntryFileAction } from '../userEvents';
import { getProjectManager } from '../projectViews/projectControl';
import { registerCommand } from './commandUtil';

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
    async () => {
      const result = await confirm('Do you want to clear all applications?');
      if (result) {
        allApplications.clear();
        getProjectManager().practiceSession?.pdp.reset();
      }
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