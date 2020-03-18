import { window } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';

import { initServer } from './net/server';
import { initCodeDeco } from './codeDeco';

import { initContextView } from './contextView/contextViewController';
import { initCallStackView } from './callStackView/callStackViewController';
import { initCommands } from './commands/index';
import { initToolBar } from './toolbar';
import { initPlayback } from './playback/index';

import { initCodeApplications } from './CodeApplication';
import { initTraceDetailsController } from './traceDetailsView/traceDetailsController';
import { initResources } from './resources';
import { initTraceSelection } from './codeSelection';
import { initEditorTracesController } from './editorTracesView/editorTracesController';
import { initApplicationsViewController } from './applicationsView/applicationsViewController';
import { initLogging } from './logging';


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
    
    initTraceSelection(context);
    initEditorTracesController(context);
    initApplicationsViewController(context);
    
    const contextViewController = initContextView();
    const callStackViewController = initCallStackView();
    const playbackController = initPlayback();
    const traceDetailsController = initTraceDetailsController(context);

    initCommands(
      context,
      contextViewController,
      callStackViewController,
      playbackController,
      traceDetailsController
    );
    
    initToolBar(context, contextViewController);
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
