import vscode from 'vscode';

function registerCommand(context, name, cb) {
  const disposable = vscode.commands.registerCommand(name, cb);
  context.subscriptions.push(disposable);
}

export function initCommands(context) {
  registerCommand(context, 'extension.startdbux', function () {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage('hi!');
  });
}