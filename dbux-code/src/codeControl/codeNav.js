import { newLogger } from 'dbux-common/src/log/logger';

import {
  window,
  Selection
} from 'vscode';


const { log, debug, warn, error: logError } = newLogger('CodeNav');

/**
 * @param {vscode.Uri} URI (new vscode.Uri.file(FILEPATH))
 * @param {vscode.Position} position (new vscode.Position(LINE, CHARACTER))
 */
export function navToCode(URI: Uri, position: Position){
  window.showTextDocument(URI).then( editor => {
    const range = editor.document.lineAt(position._line).range;
    editor.selection =  new Selection(range.start, range.end);
    editor.revealRange(range);
  })
}