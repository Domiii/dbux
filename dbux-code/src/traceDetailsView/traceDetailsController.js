import { ExtensionContext } from 'vscode';
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
    this.tracesAtCursor = null; // assign on init
  }
  
  get treeView() {
    return this.treeDataProvider.treeView;
  }

  reveal() {
    this.treeView.reveal(this.treeDataProvider.rootNodes[1]);
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
    let trace = this.tracesAtCursor.get();
    if (traceSelection.selected === trace) {
      this.tracesAtCursor.next();
      trace = this.tracesAtCursor.get();
    }
    if (trace) {
      traceSelection.selectTrace(trace, 'selectTraceAtCursor');
    }
  }

  previousStaticTrace() {
    this.tracesAtCursor.previous();
    const trace = this.tracesAtCursor.get();
    if (trace) {
      traceSelection.selectTrace(trace, 'selectTraceAtCursor');
    }
  }

  nextStaticTrace() {
    this.tracesAtCursor.next();
    const trace = this.tracesAtCursor.get();
    if (trace) {
      traceSelection.selectTrace(trace, 'selectTraceAtCursor');
    }
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
      this.reveal();
    });
  }
}

// ###########################################################################
// init
// ###########################################################################

export function initTraceDetailsView(context: ExtensionContext) {
  controller = new TraceDetailsController();
  controller.initOnActivate(context);

  // refresh right away
  controller.refresh();

  return controller;
}