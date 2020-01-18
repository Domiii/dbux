import vscode from 'vscode';
import { refreshTreeView } from '../treeView';
import { navToCode } from '../codeControl';

const log = (...args) => console.log('[dbux-code][commands]', ...args)

// command regist helper
function registerCommand (context, commandID, func, pushToClient=false){

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

  const newCommand = vscode.commands.registerCommand(commandID, _errWrap(func));
  if (pushToClient) context.subscriptions.push(newCommand);

  return newCommand
}

export function initCommands(context) {

  registerCommand(context, 'dbuxEvents.refreshEntry', () => refreshTreeView());
  registerCommand(context, 'dbuxEvents.addEntry', () => vscode.window.showInformationMessage(`Clicked on add entry.`));
  registerCommand(context, 'dbuxEvents.gotoEntry', ({ position }) => navToCode(vscode.Uri.file(position.filePath), vscode.Position(position.line, position.character)));
  registerCommand(context, 'dbuxEvents.deleteEntry', (node) => vscode.window.showInformationMessage(`Clicked on delete entry with node = ${node.label}.`));

  function jumpToLine (lineNum = 0){
    const editor = vscode.window.activeTextEditor;
    const range = editor.document.lineAt(lineNum).range;
    editor.selection =  new vscode.Selection(range.start, range.start);
    editor.revealRange(range);
  }

  log('Sucessfully "initCommands".');
}