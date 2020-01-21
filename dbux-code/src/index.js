import { newLogger } from 'dbux-common/src/log/logger';
import { initCommands } from './commands';
import { initCodeControl } from './codeControl';
import { initServer } from './net/server';

import { newDataProvider } from './data';
import { initTreeView } from './treeView';

import { window } from 'vscode';


const { log, debug, warn, error: logError } = newLogger('Main');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	try {
		initCommands(context);
		initCodeControl(context);
		const server = initServer(context);
		const dataProvider = newDataProvider(server);
		initTreeView(context, dataProvider);
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
