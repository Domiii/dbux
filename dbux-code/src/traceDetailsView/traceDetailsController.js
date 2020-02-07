import { window, ExtensionContext, TextEditorSelectionChangeEvent } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import applicationCollection from 'dbux-data/src/applicationCollection';
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
  handleSelectionChanged = () => {
    const textEditor = window.activeTextEditor;
    if (!textEditor) {
      this.treeDataProvider.setSelected(null);
    }
    else {
      const { selection } = textEditor;// see https://code.visualstudio.com/api/references/vscode-api#Selection
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
    }
  }
}

// ###########################################################################
// init
// ###########################################################################

export function getTraceDetailsController() {
  return traceDetailsController;
}

export function initTraceDetailsController(context: ExtensionContext) {
  traceDetailsController = new TraceDetailsController();

  // update initialy
  traceDetailsController.handleSelectionChanged();

  // ########################################
  // hook up event handlers
  // ########################################

  // data changed
  applicationCollection.selection.onSelectionChanged((selectedApps) => {
    for (const app of selectedApps) {
      applicationCollection.selection.subscribe(
        app.dataProvider.onData('traces', traceDetailsController.treeDataProvider.refresh)
      );
    }
  });

  // TODO: when selecting node, select as "current trace" in playback

  // text selection
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(traceDetailsController.handleSelectionChanged)
  );
}