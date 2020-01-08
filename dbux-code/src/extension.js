'use strict'

const vscode = require('vscode');
const { EventNodeProvider } = require('./treeData.js')

// import * as vscode from 'vscode';
// import { EventNodeProvider } from './treeData.js';

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('Congratulations, your extension "dbux_extension" is now active!');

    const eventLogProvider = new EventNodeProvider([]);
    vscode.window.registerTreeDataProvider('dbuxEvents', eventLogProvider);
    vscode.commands.registerCommand('dbuxEvents.refreshEntry', () => eventLogProvider.refresh());
    vscode.commands.registerCommand('dbuxEvents.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
    vscode.commands.registerCommand('dbuxEvents.editEntry', (node) => console.log("Clicked on editEntry", node));
    vscode.commands.registerCommand('dbuxEvents.deleteEntry', (node) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

	// dbux server
	var app = require('http').createServer(handler);
	var io = require('socket.io')(app);

	function handler(req, res){
		res.end()
	}

	app.listen(80);

	io.on('connection', function (socket) {
		vscode.window.showInformationMessage(`Your program sucessfully connected to dbux extension.`);
		socket.on('setTreeData', function (data) {
			eventLogProvider.data = data
		});
	});
	
	let nextJumpLineTarget = 0;

	function jumpToLine (){
		let editor = vscode.window.activeTextEditor;
		let range = editor.document.lineAt(nextJumpLineTarget).range;
		editor.selection =  new vscode.Selection(range.start, range.start);
		editor.revealRange(range);
		io.emit('jumpButtonClicked', {})
		// vscode.commands.executeCommand('cursorMove', { to: 'wrappedLineStart', value: position })
	}

	registCommand('dbuxExtension.dbux_jump', jumpToLine);

	function funcWithParam(msg = "meow", ...args){
		vscode.window.showInformationMessage(msg)
		console.log(args)
	}

	registCommand('dbuxExtension.showMsg', funcWithParam)
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

		let newCommand = vscode.commands.registerCommand(commandID, _errWrap(f));
		context.subscriptions.push(newCommand);

		return newCommand
	}
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	vscode.window.showInformationMessage('Extension down');
}

module.exports = {
	activate,
	deactivate
}
