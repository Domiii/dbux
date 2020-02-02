import {
  Disposable,
  workspace,
  window,
  OverviewRulerLane,
  DecorationOptions,
  Range,
  TextEditor
} from 'vscode';


import { makeDebounce } from 'dbux-common/src/util/scheduling';
import { newLogger } from 'dbux-common/src/log/logger';
import TraceType, { dynamicTypeTypes } from 'dbux-common/src/core/constants/TraceType';
import applicationCollection from 'dbux-data/src/applicationCollection';
import { getCodeRangeFromLoc } from '../util/codeUtil';
import { initTraceDecorators, renderTraceDecorations } from './traceDecorators';
// import DataProvider from 'dbux-data/src/DataProvider';
// import StaticContextType from 'dbux-common/src/core/constants/StaticContextType';

const { log, debug, warn, error: logError } = newLogger('code-deco');

let activeEditor: TextEditor;
let unsubscribeFromSelectedApplication;


// ###########################################################################
// render
// ###########################################################################

const renderDecorations = makeDebounce(function renderDecorations() {
  if (!activeEditor) {
    return;
  }

  const fpath = activeEditor.document.uri.fsPath;
  const dataProvider = applicationCollection.getSelectedApplication()?.dataProvider;
  if (!dataProvider) {
    return;
  }

  const programId = dataProvider.queries.programIdByFilePath(fpath);
  if (!programId) {
    // debug('Program not executed', fpath);
    return;
  }

  // render traces
  renderTraceDecorations(dataProvider, activeEditor, programId, fpath);
});


// ###########################################################################
// init
// ###########################################################################

/**
 * Relevant VSCode API (https://code.visualstudio.com/api/references/vscode-api):
 *  DecorationRenderOptions
 *  DocumentHighlight
 *  DocumentLinkProvider
 *  DocumentRangeFormattingEditProvider
 * 
 */
export function initCodeDeco(context) {
  // init traces
  initTraceDecorators();

  // start rendering
  activeEditor = window.activeTextEditor;

  const selectedApplication = applicationCollection.getSelectedApplication();
  if (selectedApplication && activeEditor) {
    // initial render
    renderDecorations();
  }

  // ########################################
  // register event listeners
  // ########################################

  // data changed
  applicationCollection.onSelectionChanged((app) => {
    unsubscribeFromSelectedApplication && unsubscribeFromSelectedApplication();
    if (app) {
      unsubscribeFromSelectedApplication = app.dataProvider.onData({
        collections: {
          traces: renderDecorations,
          staticTraces: renderDecorations
        }
      });
    }
  });

  // active window changed
  window.onDidChangeActiveTextEditor(editor => {
    activeEditor = editor;
    if (editor) {
      renderDecorations();
    }
  }, null, context.subscriptions);

  // text content changed?
  // workspace.onDidChangeTextDocument(event => {
  //   if (activeEditor && event.document === activeEditor.document) {
  //     renderDecorations();
  //   }
  // }, null, context.subscriptions);
}
