import { initCommands } from './commands';
import { initCodeControl } from './codeControl';
import { initServer } from './net/server';

import { newDataProvider } from './data';
import { initTreeView } from './treeView';

import vscode from 'vscode';

const log = (...args) => console.log('[dbux-code]', ...args)

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
	vscode.window.showInformationMessage('Extension down');
}

export {
	activate,
	deactivate
}
