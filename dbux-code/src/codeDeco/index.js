import {
  Disposable,
  workspace,
  window,
  OverviewRulerLane,
  DecorationOptions,
  Range,
  TextEditor
} from 'vscode';

import { makeDebounce } from '@dbux/common/src/util/scheduling';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import { renderTraceDecorations, clearTraceDecorations } from './traceDecorator';
import { initTraceDecorators } from './traceDecoConfig';
import { initEditedWarning } from './editedWarning';
// import DataProvider from '@dbux/data/src/DataProvider';
// import StaticContextType from '@dbux/common/src/core/constants/StaticContextType';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('code-deco');

/**
 * @type {TextEditor}
 */
let activeEditor;
let showDeco = true;


// ###########################################################################
// render
// ###########################################################################

const renderDecorations = makeDebounce(function renderDecorations() {
  if (!activeEditor) {
    return;
  }

  const fpath = activeEditor.document.uri.fsPath;

  if (showDeco) {
    // render traces
    renderTraceDecorations(activeEditor, fpath);
  }
  else {
    clearTraceDecorations(activeEditor);
  }
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

  initEditedWarning();

  // start rendering
  activeEditor = window.activeTextEditor;

  if (!allApplications.selection.isEmpty() && activeEditor) {
    // initial render
    renderDecorations();
  }

  // ########################################
  // register event listeners
  // ########################################

  // data changed
  allApplications.selection.onApplicationsChanged((selectedApps) => {
    // applications changed -> re-render
    renderDecorations();

    // also subscribe to data events
    for (const app of selectedApps) {
      allApplications.selection.subscribe(
        app.dataProvider.onData('traces', renderDecorations),
        app.dataProvider.onData('staticTraces', renderDecorations)
      );
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

export function setShowDeco(val) {
  showDeco = !!val;
  renderDecorations();
}

export function switchShowDeco() {
  setShowDeco(!showDeco);
}