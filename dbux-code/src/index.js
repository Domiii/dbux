// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { initCommands } from './commands/index';
import { initCodeControl } from './codeControl/index';
import { initServer } from './server/index';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  initCommands(context);
  initCodeControl(context);
  initServer(context);
}

// this method is called when your extension is deactivated
function deactivate() {

}

export {
  activate,
  deactivate
}
