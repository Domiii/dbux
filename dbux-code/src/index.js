import { newLogger } from 'dbux-common/src/log/logger';
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

    // const treeViewController = initTreeView();
    // const playbackController = initPlayback(treeViewController);
    // initCommands(context, treeViewController, playbackController);
    // initToolBar(context, treeViewController);
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
