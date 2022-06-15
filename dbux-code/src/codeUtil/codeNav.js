import {
  window,
  Uri,
  Selection,
  ViewColumn,
  TextEditorRevealType
} from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { normalizeDriveLetter, pathNormalized } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { babelLocToCodeRange } from '../helpers/codeLocHelpers';

/** @typedef {import('@dbux/common/src/types/Loc').default} Loc */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('codeNav');

/**
 * @param {string} fpath
 * @param {Loc} loc
 */
export async function goToCodeLoc(fpath, loc) {
  const editor = await showTextDocument(fpath);
  if (loc) {
    selectLocInEditor(editor, loc);
  }
}

export function selectLocInEditor(editor, loc) {
  const range = babelLocToCodeRange(loc);
  editor.selection = new Selection(range.start, range.end);
  editor.revealRange(range, TextEditorRevealType.InCenterIfOutsideViewport);
}


let editorOpenPromise;
let lastRequestedDocumentFpath;

/**
 * Hackfix for buggy `showTextDocument`.
 * It rejects all in-flight promises, if you query it too fast; so we need to slow things down.
 * @see https://github.com/microsoft/vscode/issues/93003
 */
export async function showTextDocument(fpath, column) {
  // see https://code.visualstudio.com/api/references/vscode-api#Uri
  // console.log('previous active editor', window.activeTextEditor.document?.uri.path);
  if (lastRequestedDocumentFpath === fpath) {
    return editorOpenPromise;
  }
  // await editorOpenPromise; // this will actually cause the bug again! (not sure why...)
  lastRequestedDocumentFpath = fpath;

  if (!column) {
    // use naive heuristic: if active file is js file choose active column
    if (window.activeTextEditor?.document?.fileName?.endsWith('.js')) {
      // column = ViewColumn.Active;
      column = window.activeTextEditor.viewColumn || ViewColumn.One;
    }
    else {
      column = ViewColumn.One;
    }
  }

  const uri = Uri.file(fpath);
  try {
    editorOpenPromise = window.showTextDocument(uri, column);
    const editor = await editorOpenPromise;
    return editor;
  }
  catch (err) {
    logTrace('window.showTextDocument failed:', fpath, ' - ', err);
  }
  finally {
    // reset everything
    lastRequestedDocumentFpath = null;
    editorOpenPromise = null;
  }
  return null;
}


export async function getEditorByFilePath(fpath) {

}

// /**
//  * Returns null if file is not open.
//  */
// export async function getTraceEditor(trace) {
//   const dp = allApplications.getApplication(trace.applicationId).dataProvider;
//   const filePath = dp.queries.programFilePathByTraceId(trace.traceId);
// }

export async function getOrOpenTraceEditor(trace) {
  const dp = allApplications.getApplication(trace.applicationId).dataProvider;
  const filePath = dp.queries.programFilePathByTraceId(trace.traceId);

  return showTextDocument(filePath);
}

export function getTraceDocumentUri(trace) {
  const dp = allApplications.getApplication(trace.applicationId).dataProvider;
  const filePath = dp.queries.programFilePathByTraceId(trace.traceId);
  return Uri.file(filePath);
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
    // see: https://code.visualstudio.com/api/references/vscode-api#Selection
    const { selection } = textEditor;
    if (selection) {
      const fpath = pathNormalized(normalizeDriveLetter(textEditor.document.uri.fsPath));
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

export function showTextInNewFile(tempFileName, text) {
  return new Promise((resolve, reject) => {
    const uri = Uri.parse(`untitled:/${tempFileName}`);
    window.showTextDocument(uri).then(editor => {
      editor.edit(editBuilder => {
        editBuilder.replace(editor.selection, text);

        resolve();
      });
    }).catch(err => {
      reject(err);
    });
  });
}