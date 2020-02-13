import { window, ExtensionContext, TextEditorSelectionChangeEvent } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import TraceDetailsDataProvider from './TraceDetailsDataProvider';
import { initTraceDetailsCommands } from './commands';

const { log, debug, warn, error: logError } = newLogger('traceDetailsController');

let traceDetailsController;

class TraceDetailsController {
  constructor() {
    this.treeDataProvider = new TraceDetailsDataProvider();
    this.treeView = window.createTreeView('dbuxTraceDetailsView', {
      treeDataProvider: this.treeDataProvider
    });
  }
}

// ###########################################################################
// init
// ###########################################################################

export function getTraceDetailsController() {
  return traceDetailsController;
}

export function initTraceDetailsController(context: ExtensionContext) {
  initTraceDetailsCommands(context);

  traceDetailsController = new TraceDetailsController();

  // update command wrapper
  traceDetailsController.treeDataProvider.commandWrapper.init(context, 'traceDetailsClick');

  // refresh right away
  traceDetailsController.treeDataProvider.refresh();

  // ########################################
  // hook up event handlers
  // ########################################

  // data changed
  allApplications.selection.onApplicationsChanged((selectedApps) => {
    for (const app of selectedApps) {
      allApplications.selection.subscribe(
        app.dataProvider.onData('traces', traceDetailsController.treeDataProvider.refresh)
      );
    }
  });

  // add traceSelection event handler
  traceSelection.onTraceSelectionChanged(selectedTrace => {
    traceDetailsController.treeDataProvider.refresh();
  });

  // TODO: get rid of this?
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(() => {
      traceDetailsController.treeDataProvider.refresh();
    })
  );
}