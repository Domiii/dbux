import { window, ExtensionContext, TextEditorSelectionChangeEvent } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import TraceDetailsDataProvider from './TraceDetailsDataProvider';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import { registerCommand } from '../commands/commandUtil';
import EditorTracesDataProvider from './EditorTracesDataProvider';

const { log, debug, warn, error: logError } = newLogger('traceDetailsController');

let traceDetailsController;

class EditorTracesControllers {
  constructor() {
    this.treeDataProvider = new EditorTracesDataProvider();
    this.treeView = window.createTreeView('dbuxEditorTracesView', {
      treeDataProvider: this.treeDataProvider
    });
  }

  refreshOnData = makeDebounce(() => {
    traceDetailsController.treeDataProvider.refresh();
    if (this.applicationsChanged) {
      this.applicationsChanged = false;
      const firstNode = traceDetailsController.treeDataProvider.rootNodes?.[0];
      traceDetailsController.treeView.reveal(firstNode, { focus: true });
    }
  }, 20);


  initEventListeners(context) {
    // ########################################
    // hook up event handlers
    // ########################################

    // data changed
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.applicationsChanged = true;
      for (const app of selectedApps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('traces', this.refreshOnData)
        );
      }
    });

    // traceSelection changed
    traceSelection.onTraceSelectionChanged(selectedTrace => {
      traceDetailsController.treeDataProvider.refresh();
    });

    // cursor moved in text editor
    context.subscriptions.push(
      window.onDidChangeTextEditorSelection(() => {
        traceDetailsController.treeDataProvider.refresh();
      })
    );
  }
}

// ###########################################################################
// init
// ###########################################################################


export function initTraceDetailsCommands(context) {
  registerCommand(context,
    'dbuxEditorTracesView.itemClick',
    (treeDetailsDataProvider, node) => treeDetailsDataProvider._handleClick(node)
  );
}

export function getTraceDetailsController() {
  return traceDetailsController;
}

export function initTraceDetailsController(context: ExtensionContext) {
  initTraceDetailsCommands(context);

  traceDetailsController = new EditorTracesControllers();
  traceDetailsController.initEventListeners(context);

  // refresh right away
  traceDetailsController.treeDataProvider.refresh();
}