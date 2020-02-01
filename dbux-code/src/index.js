import { newLogger } from 'dbux-common/src/log/logger';
import { newDataProvider } from 'dbux-data/src/dataProviderImpl';
import { window } from 'vscode';

import { initCodeControl } from './codeControl';
import { initServer } from './net/server';

import { initTreeView } from './treeView/treeViewController';
import { initCommands } from './commands/index';
import { initToolBar } from './toolbar';
import { initPlayback } from './playback/index';

import PlaybackController from './playback/PlaybackController';


const {
  log, debug, warn, error: logError,
} = newLogger('dbux-code');

let server;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  try {
    server = initServer(context);
    initCodeControl(context);

    // TODO: we don't have a single DataProvider anymore - manage Applications instead
    const dataProvider = newDataProvider('not/an/application');
    const treeViewController = initTreeView(context, dataProvider);
    const playbackController = initPlayback(dataProvider, treeViewController);
    initCommands(context, treeViewController, playbackController);
    initToolBar(context, treeViewController);
  } catch (e) {
    logError('could not activate', e);
    throw e;
  }
}

// this method is called when your extension is deactivated
function deactivate() {
  window.showInformationMessage('Extension down');
}

export {
  activate,
  deactivate,
};
