import { window } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';

import { initServer } from './net/server';
import { initCodeDeco } from './codeDeco';

import { initContextView } from './contextView/contextViewController';
import { initCommands } from './commands/index';
import { initToolBar } from './toolbar';
import { initPlayback } from './playback/index';

import PlaybackController from './playback/PlaybackController';
import { initCodeApplications } from './CodeApplication';
import { initTraceDetailsController } from './traceDetailsView/traceDetailsController';
import { initResources } from './resources';
import { initTraceSelection } from './codeSelection';


const { log, debug, warn, error: logError } = newLogger('dbux-code');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  try {
    initResources(context);
    initServer(context);
    initCodeApplications(context);
    initCodeDeco(context);
    
    initTraceSelection(context);
    initTraceDetailsController(context);

    const contextViewController = initContextView();
    const playbackController = initPlayback();
    initCommands(context, contextViewController, playbackController);
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
