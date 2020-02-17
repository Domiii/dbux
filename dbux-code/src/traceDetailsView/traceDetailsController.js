import { window, ExtensionContext, TextEditorSelectionChangeEvent } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import TraceDetailsDataProvider from './TraceDetailsDataProvider';
import { initTraceDetailsCommands } from './commands';
import { makeDebounce } from 'dbux-common/src/util/scheduling';

const { log, debug, warn, error: logError } = newLogger('traceDetailsController');

let traceDetailsController;

class TraceDetailsController {
  constructor() {
    this.treeDataProvider = new TraceDetailsDataProvider();
    this.treeView = window.createTreeView('dbuxTraceDetailsView', {
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
  }, 20)

  addEventListeners(context) {
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
  traceDetailsController.addEventListeners(context);

  // update command wrapper
  // TODO: to get rid of the `commandWrapper` again; it is not needed after all
  traceDetailsController.treeDataProvider.commandWrapper.init(context, 'traceDetailsClick');

  // refresh right away
  traceDetailsController.treeDataProvider.refresh();
}