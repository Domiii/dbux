import { window, ExtensionContext } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import TraceDetailsDataProvider from './TraceDetailsNodeProvider';
import { modeChangedEvent } from './nodes/StaticTraceTDNodes';

const { log, debug, warn, error: logError } = newLogger('traceDetailsController');

let controller;

class TraceDetailsController {
  constructor() {
    this.treeDataProvider = new TraceDetailsDataProvider();
    this.treeView = this.treeDataProvider.treeView;
  }

  refreshOnData = makeDebounce(() => {
    controller.treeDataProvider.refresh();
  }, 20);

  initOnActivate(context) {
    // ########################################
    // hook up event handlers
    // ########################################

    // click event listener
    this.treeDataProvider.initDefaultClickCommand(context);

    // data changed
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      for (const app of selectedApps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('traces', this.refreshOnData)
        );
      }
    });

    // add traceSelection event handler
    traceSelection.onTraceSelectionChanged(() => {
      controller.treeDataProvider.refresh();
    });

    // on staticTraceTDNode grouping mode changed
    modeChangedEvent.on('changed', this.treeDataProvider.refresh);
  }
}

// ###########################################################################
// init
// ###########################################################################

export function initTraceDetailsController(context: ExtensionContext) {
  controller = new TraceDetailsController();
  controller.initOnActivate(context);

  // refresh right away
  controller.treeDataProvider.refresh();
}