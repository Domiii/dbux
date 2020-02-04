import { newLogger } from 'dbux-common/src/log/logger';
import { getCodeRangeFromLoc } from '../util/codeUtil';
import Loc from 'dbux-common/src/core/data/Loc';

import {
  window,
  Uri,
  Position,
  Selection
} from 'vscode';



const { log, debug, warn, error: logError } = newLogger('CodeNav');

/**
 * @param {vscode.Uri} URI (new vscode.Uri.file(FILEPATH))
 * @param {vscode.Position} position (new vscode.Position(LINE, CHARACTER))
 */
export function navToCode(URI: Uri, location: Loc){
  window.showTextDocument(URI).then( editor => {
    const range = getCodeRangeFromLoc(location)
    editor.selection =  new Selection(range.start, range.end);
    editor.revealRange(range);
  })
}