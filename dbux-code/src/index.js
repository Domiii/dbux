// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode';
import { initCommands } from './commands/index';
import { initCodeControl } from './codeControl/index';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

  initCommands();
  initCodeControl();
}

// this method is called when your extension is deactivated
function deactivate() {

}

export {
  activate,
  deactivate
}
