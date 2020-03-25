import { window, ExtensionContext } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import TraceDetailsDataProvider from './TraceDetailsNodeProvider';
import TracesAtCursor from './TracesAtCursor';

const { log, debug, warn, error: logError } = newLogger('traceDetailsController');

let controller;

class TraceDetailsController {
  constructor() {
    this.treeDataProvider = new TraceDetailsDataProvider();
    this.treeView = this.treeDataProvider.treeView;
    this.tracesAtCursor = null; // assign on init
  }

  refresh = () => {
    this.treeDataProvider.refresh();
  }

  refreshOnData = makeDebounce(() => {
    this.refresh();
    this.tracesAtCursor.needRefresh = true;
    this.tracesAtCursor.updateSelectTraceAtCursorButton();
  }, 20);

  selectTraceAtCursor = () => {
    const nextTrace = this.tracesAtCursor.getNext();
    if (nextTrace) traceSelection.selectTrace(nextTrace, 'selectTraceAtCursor');
  }

  initOnActivate(context) {
    this.tracesAtCursor = new TracesAtCursor(context);

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
      this.refresh();
    });
  }
}

// ###########################################################################
// init
// ###########################################################################

export function initTraceDetailsController(context: ExtensionContext) {
  controller = new TraceDetailsController();
  controller.initOnActivate(context);

  // refresh right away
  controller.refresh();

  return controller;
}