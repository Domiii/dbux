import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';

import { initRuntimeServer } from './net/SocketServer';
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
import { initProjectView } from './projectView/projectViewController';
import { initLogging } from './logging';
import { showGraphView } from './graphView';
import { initDbuxPractice } from './practice/dbuxPracticeController';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-code');

let projectViewController;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  try {
    initLogging();
    initResources(context);
    initRuntimeServer(context);
    initCodeApplications(context);
    initCodeDeco(context);
    initToolBar(context);
    initDbuxPractice(context);

    initTraceSelection(context);
    initPlayback();
    
    initApplicationsView(context);
    const traceDetailsController = initTraceDetailsView(context);
    projectViewController = initProjectView(context);
    
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
      projectViewController,
      callGraphViewController
    );

    // for now, let's activate the graph view right away
    showGraphView(context);
  } catch (e) {
    logError('could not activate', e);
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