import {
  window,
  Uri,
  Position,
  Selection
} from 'vscode';
import { newFileLogger } from 'dbux-common/src/log/logger';
import Loc from 'dbux-common/src/core/data/Loc';
import allApplications from 'dbux-data/src/applications/allApplications';
import { babelLocToCodeRange } from '../helpers/codeLocHelpers';


const { log, debug, warn, error: logError } = newFileLogger(__filename);

/**
 * @param {Uri} URI (new vscode.Uri.file(FILEPATH))
 * @param {Position} position (new vscode.Position(LINE, CHARACTER))
 */
export async function goToCodeLoc(fpath, loc: Loc) {
  const editor = await showTextDocument(fpath);
  selectLocInEditor(editor, loc);
}

export function selectLocInEditor(editor, loc) {
  const range = babelLocToCodeRange(loc);
  editor.selection = new Selection(range.start, range.end);
  editor.revealRange(range);
}


let editorOpenPromise;
let lastRequestedDocumentFpath;

/**
 * Hackfix for buggy `showTextDocument`.
 * It rejects all in-flight promises, if you query it too fast; so we need to slow things down.
 * @see https://github.com/microsoft/vscode/issues/93003
 */
export async function showTextDocument(fpath) {
  // see https://code.visualstudio.com/api/references/vscode-api#Uri
  // console.log(window.activeTextEditor.document.uri.path);
  if (lastRequestedDocumentFpath === fpath) {
    return editorOpenPromise;
  }
  // await editorOpenPromise; // this will actually cause the bug again! (not sure why...)
  lastRequestedDocumentFpath = fpath;

  const uri = Uri.file(fpath);
  try {
    editorOpenPromise = window.showTextDocument(uri);
    const editor = await editorOpenPromise;
    return editor;
  }
  catch (err) {
    logError('window.showTextDocument failed:', fpath, ' - ', err);
  }
  finally {
    // reset everything
    lastRequestedDocumentFpath = null;
    editorOpenPromise = null;
  }
  return null;
}

export async function getOrOpenTraceEditor(trace) {
  const dp = allApplications.getApplication(trace.applicationId).dataProvider;
  const filePath = dp.queries.programFilePathByTraceId(trace.traceId);

  return showTextDocument(filePath);
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