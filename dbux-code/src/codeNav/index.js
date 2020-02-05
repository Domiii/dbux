import {
  window,
  Uri,
  Position,
  Selection
} from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import Loc from 'dbux-common/src/core/data/Loc';
import { babelLocToCodeRange } from '../helpers/locHelper';


const { log, debug, warn, error: logError } = newLogger('CodeNav');

/**
 * @param {Uri} URI (new vscode.Uri.file(FILEPATH))
 * @param {Position} position (new vscode.Position(LINE, CHARACTER))
 */
export function navToCode(URI: Uri, location: Loc) {
  window.showTextDocument(URI).then(editor => {
    const range = babelLocToCodeRange(location);
    editor.selection = new Selection(range.start, range.end);
    editor.revealRange(range);
  });
}