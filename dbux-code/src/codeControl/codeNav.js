/**
 * Location (https://code.visualstudio.com/api/references/vscode-api#Location)
 * Selection
 * SelectionRange
 */

import vscode from 'vscode';

const log = (...args) => console.log('[dbux-code][codeNav]', ...args)

/**
 * @param {vscode.Uri} URI (new vscode.Uri.file(FILEPATH))
 * @param {vscode.Position} position (new vscode.Position(LINE, CHARACTER))
 */
export function navToCode(URI, position){
  log(`Called navToCode with params { URI = ${URI}, position = ${JSON.stringify(position)} }`)
  vscode.window.showTextDocument(URI).then( editor => {
    const range = editor.document.lineAt(position._line).range;
    editor.selection =  new vscode.Selection(range.start, range.end);
    editor.revealRange(range);
  })
}