function registerCommand(name, cb) {
  let disposable = vscode.commands.registerCommand(name, cb);
  context.subscriptions.push(disposable);
}

export function initCommands() {
  registerCommand('extension.startdbux', function () {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage('aszxdd!');
  });
}