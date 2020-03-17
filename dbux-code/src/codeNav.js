import {
  window,
  Uri,
  Position,
  Selection
} from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import Loc from 'dbux-common/src/core/data/Loc';
import allApplications from 'dbux-data/src/applications/allApplications';
import { babelLocToCodeRange } from './helpers/codeLocHelpers';


const { log, debug, warn, error: logError } = newLogger('CodeNav');

/**
 * @param {Uri} URI (new vscode.Uri.file(FILEPATH))
 * @param {Position} position (new vscode.Position(LINE, CHARACTER))
 */
export function goToCodeLoc(URI: Uri, loc: Loc) {
  window.showTextDocument(URI).then(editor => {
    selectLocInEditor(editor, loc);
  });
}

export function selectLocInEditor(editor, loc) {
  const range = babelLocToCodeRange(loc);
  editor.selection = new Selection(range.start, range.end);
  editor.revealRange(range);
}

export async function getOrOpenTraceEditor(trace) {
  const dp = allApplications.getApplication(trace.applicationId).dataProvider;
  const filePath = dp.queries.programFilePathByTraceId(trace.traceId);
  return window.showTextDocument(Uri.file(filePath));
}

export async function goToTrace(trace) {
  const dp = allApplications.getApplication(trace.applicationId).dataProvider;
  const { staticTraceId } = dp.collections.traces.getById(trace.traceId);
  const { loc } = dp.collections.staticTraces.getById(staticTraceId);

  const editor = await getOrOpenTraceEditor(trace);
  selectLocInEditor(editor, loc);
}

export function getCursorLocation() {
  const textEditor = window.activeTextEditor;
  if (textEditor) {
    const { selection } = textEditor;// see https://code.visualstudio.com/api/references/vscode-api#Selection
    if (selection) {
      const fpath = textEditor.document.uri.fsPath;
      const { active } = selection;

      const where = {
        fpath,
        pos: active
      };
      return where;
    }
  }
  return null;
}