import { newLogger } from 'dbux-common/src/log/logger';
import { initCodeControl } from './codeControl';
import { initServer } from './net/server';

import { newDataProvider } from './data';
import { initTreeView } from './treeView/treeViewController';
import { initCommands } from './commands/index';
import { initToolBar } from './toolbar';
import { initPlayback } from './playback/index';

import { window } from 'vscode';
import PlaybackController from './playback/PlaybackController';


const { log, debug, warn, error: logError } = newLogger('Main');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	try {
		initCodeControl(context);
		const server = initServer(context);
		const dataProvider = newDataProvider(server);
		const treeViewController =  initTreeView(context, dataProvider);
		const playbackController = initPlayback(dataProvider, treeViewController);
		initCommands(context, treeViewController, playbackController);
		initToolBar(context, treeViewController);
	}
	catch(e){
		console.error(e)
		debugger;
		throw e;
	}
	
}

// this method is called when your extension is deactivated
function deactivate() {
	window.showInformationMessage('Extension down');
}

export {
	activate,
	deactivate
}
