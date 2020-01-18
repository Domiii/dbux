import { initCommands } from './commands';
import { initCodeControl } from './codeControl';
import { initServer } from './server';
import { initTreeView } from './treeView';
import { newDataProvider } from './data/index';

import vscode from 'vscode';

const log = (...args) => console.log('[dbux-code]', ...args)


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	initCommands(context);
	initCodeControl(context);
	const server = initServer(context);
	const dataProvider = newDataProvider(server);
	const treeView = initTreeView(context);

}

// this method is called when your extension is deactivated
function deactivate() {
	vscode.window.showInformationMessage('Extension down');
}

export {
	activate,
	deactivate
}
