import { window } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';

import { initServer } from './net/RuntimeServer';
import { initCodeDeco } from './codeDeco';

import { initCallGraphView } from './callGraphView/callGraphViewController';
import { initCallStackView } from './callStackView/callStackViewController';
import { initCommands } from './commands/index';
import { initToolBar } from './toolbar';
import { initPlayback } from './playback/index';

import { initCodeApplications } from './codeUtil/CodeApplication';
import { initTraceDetailsView } from './traceDetailsView/traceDetailsController';
import { initResources } from './resources';
import { initTraceSelection } from './codeUtil/codeSelection';
import { initEditorTracesView } from './editorTracesView/editorTracesController';
import { initApplicationsView } from './applicationsView/applicationsViewController';
import { initProjectView } from './projectView/projectViewController';
import { initLogging } from './logging';
import { showGraphView } from './graphView';


const { log, debug, warn, error: logError } = newLogger('dbux-code');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  try {
    initLogging();
    initResources(context);
    initServer(context);
    initCodeApplications(context);
    initCodeDeco(context);
    initToolBar(context);

    initTraceSelection(context);
    initEditorTracesView(context);
    initApplicationsView(context);
    initPlayback();
    
    const callGraphViewController = initCallGraphView();
    const callStackViewController = initCallStackView();
    const projectViewController = initProjectView(context);
    const traceDetailsController = initTraceDetailsView(context);

    initCommands(
      context,
      callGraphViewController,
      callStackViewController,
      traceDetailsController,
      projectViewController
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
  window.showInformationMessage('Dbux deactviated.');
}

export {
  activate,
  deactivate,
};
