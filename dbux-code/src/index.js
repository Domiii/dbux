import { initCommands } from './commands';
import { initCodeControl } from './codeControl';
import { initServer } from './net/server';
import { initTreeView } from './treeView';
import { newDataProvider } from './data/index';

import vscode from 'vscode';

const log = (...args) => console.log('[dbux-code]', ...args)

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	log('dbux-code activated!');

	initCommands(context);
	initCodeControl(context);
	const server = initServer(context);
	const dataProvider = newDataProvider(server);
	initTreeView(context, dataProvider);

	log('Initialization finished.');
	
}

// this method is called when your extension is deactivated
function deactivate() {
	vscode.window.showInformationMessage('Extension down');
}

export {
	activate,
	deactivate
}
