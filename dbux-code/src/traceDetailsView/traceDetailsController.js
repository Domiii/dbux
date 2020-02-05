import { window, ExtensionContext, TextEditorSelectionChangeEvent } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import TraceDetailsDataProvider from './TraceDetailsDataProvider';

const { log, debug, warn, error: logError } = newLogger('traceDetailsController');

let traceDetailsController;

class TraceDetailsController {
  constructor() {
    this.treeDataProvider = new TraceDetailsDataProvider();
    this.treeView = window.createTreeView('dbuxTraceDetailsView', {
      treeDataProvider: this.treeDataProvider
    });
  }

  /**
   * @param {TextEditorSelectionChangeEvent} evt
   */
  handleSelectionChanged = (evt) => {
    const { textEditor, selections } = evt;
    const selection = selections[0];  // see https://code.visualstudio.com/api/references/vscode-api#Selection
    if (!selection) {
      this.treeDataProvider.setSelected(null);
    }
    else {
      const fpath = textEditor.document.uri.fsPath;
      const { active } = selection;

      const where = {
        fpath,
        pos: active
      };
      this.treeDataProvider.setSelected(where);
    }
    log('Selection changed:', evt.kind, evt.selections[0]?.active.line);
  };
}

// ###########################################################################
// init
// ###########################################################################

export function initTraceDetailsController(context: ExtensionContext) {
  traceDetailsController = new TraceDetailsController();
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(traceDetailsController.handleSelectionChanged)
  );
}