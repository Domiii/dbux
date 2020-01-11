/**
 * Location (https://code.visualstudio.com/api/references/vscode-api#Location)
 * Selection
 * SelectionRange
 */

import vscode from 'vscode';

const log = (...args) => console.log('[dbux-code][codeNav]', ...args)

export function navToCode(URI, lineNum){
  log(`Called navToCode with params { URI = ${URI}, lineNum = ${lineNum} }`)
  vscode.window.showTextDocument(URI).then( editor => {
    const range = editor.document.lineAt(lineNum).range;
    editor.selection =  new vscode.Selection(range.start, range.end);
    editor.revealRange(range);
  })
}