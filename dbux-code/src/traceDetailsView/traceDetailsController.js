import { window, ExtensionContext } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import TraceDetailsDataProvider from './TraceDetailsNodeProvider';
import { initTraceDetailsCommands } from './commands';

const { log, debug, warn, error: logError } = newLogger('traceDetailsController');

let controller;

class TraceDetailsController {
  constructor() {
    this.treeDataProvider = new TraceDetailsDataProvider();
    this.treeView = window.createTreeView('dbuxTraceDetailsView', {
      treeDataProvider: this.treeDataProvider
    });
  }

  refreshOnData = makeDebounce(() => {
    controller.treeDataProvider.refresh();
    if (this.applicationsChanged) {
      this.applicationsChanged = false;
      const firstNode = controller.treeDataProvider.rootNodes?.[0];
      controller.treeView.reveal(firstNode, { focus: true });
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

    // add traceSelection event handler
    traceSelection.onTraceSelectionChanged(selectedTrace => {
      controller.treeDataProvider.refresh();
    });
  }
}

// ###########################################################################
// init
// ###########################################################################

export function getTraceDetailsController() {
  return controller;
}

export function initTraceDetailsController(context: ExtensionContext) {
  initTraceDetailsCommands(context);

  controller = new TraceDetailsController();
  controller.initEventListeners(context);

  // update command wrapper
  // TODO: to get rid of the `commandWrapper` again; it is not needed after all
  controller.treeDataProvider.commandWrapper.init(context, 'traceDetailsClick');

  // refresh right away
  controller.treeDataProvider.refresh();
}