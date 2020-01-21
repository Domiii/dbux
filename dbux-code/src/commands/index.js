import { newLogger } from 'dbux-common/src/log/logger';
import { refreshTreeView } from '../treeView';
import { navToCode } from '../codeControl/codeNav';
import { getCodePositionFromLoc } from '../util/codeUtil';
import {
  window,
  commands,
  Uri,
  Position,
  Selection
} from 'vscode';

const { log, debug, warn, error: logError } = newLogger('Commands');

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

  const newCommand = commands.registerCommand(commandID, _errWrap(func));
  if (pushToClient) context.subscriptions.push(newCommand);

  return newCommand
}

export function initCommands(context) {

  registerCommand(context, 'dbuxEvents.refreshEntry', () => refreshTreeView());
  registerCommand(context, 'dbuxEvents.addEntry', () => window.showInformationMessage(`Clicked on add entry.`));
  registerCommand(context, 'dbuxEvents.gotoEntry', ({ filePath, location }) => navToCode(Uri.file(filePath), getCodePositionFromLoc(location.start)));
  registerCommand(context, 'dbuxEvents.deleteEntry', (node) => window.showInformationMessage(`Clicked on delete entry with node = ${node.label}.`));

  function jumpToLine (lineNum = 0){
    const editor = window.activeTextEditor;
    const range = editor.document.lineAt(lineNum).range;
    editor.selection =  new Selection(range.start, range.start);
    editor.revealRange(range);
  }

}