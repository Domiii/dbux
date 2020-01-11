'use strict'

import * as vscode from 'vscode';
import { EventNodeProvider } from './treeData.js';

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('Extension "dbux-code" activated!');

    const eventLogProvider = new EventNodeProvider([]);
    vscode.window.registerTreeDataProvider('dbuxEvents', eventLogProvider);
    vscode.commands.registerCommand('dbuxEvents.refreshEntry', () => eventLogProvider.refresh());
    vscode.commands.registerCommand('dbuxEvents.addEntry', () => vscode.window.showInformationMessage(`Clicked on add entry.`));
    vscode.commands.registerCommand('dbuxEvents.gotoEntry', (node) => jumpToLine(node.position.line));
    vscode.commands.registerCommand('dbuxEvents.deleteEntry', (node) => vscode.window.showInformationMessage(`Clicked on delete entry with node = ${node.label}.`));
	console.log('Finish regist commands')

	// dbux server
	// var app = require('http').createServer(handler);
	// var io = require('socket.io')(app);

	// function handler(req, res){
	// 	res.end()
	// }

	// app.listen(80);

	// io.on('connection', function (socket) {
	// 	vscode.window.showInformationMessage(`Your program sucessfully connected to dbux extension.`);
	// 	socket.on('setTreeData', function (data) {
	// 		eventLogProvider.data = data
	// 	});
	// });

	function jumpToLine (lineNum = 0){
		console.log(`Called jumpToLine(lineNum = ${lineNum})`)
		const editor = vscode.window.activeTextEditor;
		const range = editor.document.lineAt(lineNum).range;
		editor.selection =  new vscode.Selection(range.start, range.start);
		editor.revealRange(range);
		// io.emit('jumpButtonClicked', {})
		// vscode.commands.executeCommand('cursorMove', { to: 'wrappedLineStart', value: position })
	}

	registCommand('dbuxExtension.dbux_jump', jumpToLine);

	// registCommand('extension.helloPusheen', () => vscode.window.showInformationMessage("Meow meow"))	

	// function setJumpButtonInStatusBar (fileURI, position){
	// 	console.log('Tried to set jump button.');
	// 	console.log(fileURI, position);
	// 	nextJumpLineTarget = position;
	// 	statusBarJumpButton.text = `Jump to line ${position}`;
	// 	statusBarJumpButton.show();
	// }

	// command regist helper
	function registCommand (commandID, f){

		function _errWrap (f){
			return (...args) => {
				try {
					return f(...args);
				}
				catch (err) {
					console.error(err);
					debugger;
					throw err;
				}
			}
		}

		const newCommand = vscode.commands.registerCommand(commandID, _errWrap(f));
		context.subscriptions.push(newCommand);

		return newCommand
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
