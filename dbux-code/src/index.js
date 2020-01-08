// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

  // console.log shows up in the "Debug Console"
  console.log('Congratulations, your extension "code-dbux" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('extension.startdbux', function () {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage('aszxdd!');
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {

}

export {
  activate,
  deactivate
}
