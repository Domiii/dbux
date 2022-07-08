import {
  window,
  TextEditor
} from 'vscode';

import { throttle } from '@dbux/common/src/util/scheduling';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import { renderTraceDecorations, clearTraceDecorations } from './traceDecorator';
import { initTraceDecorators } from './traceDecoConfig';
import { initEditedWarning } from './editedWarning';
import { set as mementoSet, get as mementoGet } from '../memento';
import { emitShowHideDecorationAction } from '../userEvents';
// import DataProvider from '@dbux/data/src/DataProvider';
// import StaticContextType from '@dbux/common/src/types/constants/StaticContextType';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('code-deco');

const keyName = 'dbux.showDecorations';

/**
 * @type {TextEditor}
 */
let activeEditor;

/**
 * @type {boolean}
 */
let showDeco;

// ###########################################################################
// render
// ###########################################################################

const renderDecorations = throttle(function renderDecorations() {
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

  // get information in memento
  showDeco = mementoGet(keyName);
  if (showDeco === undefined) {
    showDeco = true;
  }

  // start rendering
  activeEditor = window.activeTextEditor;

  if (!allApplications.selection.isEmpty && activeEditor) {
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

/**
 * @param {boolean} val 
 */
export function setShowDeco(val) {
  showDeco = !!val;
  mementoSet(keyName, showDeco);
  renderDecorations();
  emitShowHideDecorationAction(showDeco);
}

export function switchShowDeco() {
  setShowDeco(!showDeco);
}