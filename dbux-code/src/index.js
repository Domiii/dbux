import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { initCodeDeco } from './codeDeco';

import { initCallGraphView } from './callGraphView/callGraphViewController';
import { initCommands } from './commands/index';
import { initToolBar } from './toolbar';
import { initPlayback } from './playback/index';

import { initCodeApplications } from './codeUtil/CodeApplication';
import { initTraceDetailsView } from './traceDetailsView/traceDetailsController';
import { initResources } from './resources';
import { initTraceSelection } from './codeUtil/codeSelection';
import { initApplicationsView } from './applicationsView/applicationsViewController';
import { getOrCreateProjectManager } from './projectView/projectControl';
import { initProjectView } from './projectView/projectViewController';
import { initMemento } from './memento';
import { initLogging } from './logging';
import { initGraphView } from './graphView';
import { initWebviewWrapper } from './codeUtil/WebviewWrapper';
import { initInstallId } from './installId';
import dialogController from './dialogs/dialogController';
import { installDbuxDependencies } from './codeUtil/installUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-code');

function registerErrorHandler() {
  // process.on('unhandledRejection', (reason, promise) => {
  //   logError(`[Unhandled Rejection] reason: ${reason}, promise: ${promise}`);
  // });
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  try {
    log(`Starting Dbux v${process.env.DBUX_VERSION} (mode=${process.env.NODE_ENV}, (dev only) DBUX_ROOT=${process.env.DBUX_ROOT})...`);

    registerErrorHandler();
    initLogging();
    initResources(context);
    initMemento(context);
    await initInstallId();

    // make sure, projectManager is available
    getOrCreateProjectManager(context);

    // install dependencies (and show progress bar) right away
    await installDbuxDependencies();

    // initRuntimeServer(context);
    initCodeApplications(context);
    initCodeDeco(context);
    initToolBar(context);
    initTraceSelection(context);
    initPlayback();


    initWebviewWrapper(context);

    initApplicationsView(context);
    const traceDetailsController = initTraceDetailsView(context);
    initProjectView(context);

    //  To bring these three views back, uncomment relevant lines and add this to `package.json` `contributes.views.dbuxViewContainer`:
    //  {
    //    "id": "dbuxEditorTracesView",
    //    "name": "Traces at Cursor"
    //  },
    // {
    //   "id": "dbuxCallGraphView",
    //   "name": "Call Graph Roots"
    // },
    // {
    //   "id": "dbuxCallStackView",
    //   "name": "Call Stack"
    // },

    const callGraphViewController = initCallGraphView(context);
    // const callStackViewController = initCallStackView();
    // initEditorTracesView(context);

    initCommands(
      context,
      traceDetailsController,
      callGraphViewController
    );

    // for now, let's activate the graph view right away
    initGraphView();

    dialogController.startDialog('tutorial');
  } catch (e) {
    logError('could not activate', e.stack);
    debugger;
    throw e;
  }
}

// this method is called when your extension is deactivated
function deactivate() {
}

export {
  activate,
  deactivate,
};

global.window = window;