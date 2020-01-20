import { initCommands } from './commands';
import { initCodeControl } from './codeControl';
import { initServer } from './net/server';
<<<<<<< HEAD

import * as vscode from 'vscode';
import { EventNodeProvider } from './treeData.js';
import { newDataProvider } from './data';
=======
import { initTreeView } from './treeView';
import { newDataProvider } from './data/index';
>>>>>>> 5fb114715d9b6310cdc913e2cdf44378a85ac69f

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
