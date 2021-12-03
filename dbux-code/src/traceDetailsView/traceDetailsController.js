import { commands, ExtensionContext, window, workspace } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeDebounce } from '@dbux/common/src/util/scheduling';
import { emitSelectTraceAction } from '../userEvents';
import { getRelatedAppIds } from '../codeDeco/editedWarning';
import { showWarningMessage } from '../codeUtil/codeModals';
import TraceDetailsDataProvider from './TraceDetailsNodeProvider';
import { getOrCreateTracesAtCursor } from './TracesAtCursor';
import ErrorTraceManager from './ErrorTraceManager';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('traceDetailsController');

let controller;

class TraceDetailsController {
  constructor(context) {
    this.treeDataProvider = new TraceDetailsDataProvider();
    this.treeDataProvider.controller = this;
    this.tracesAtCursor = getOrCreateTracesAtCursor(context);
    this.errorTraceManager = new ErrorTraceManager();

    /**
     * @type {Map<number, Set>}
     */
    this.documentChangedByAppId = new Map();
    this.edited = false;
    workspace.onDidChangeTextDocument(this.handleDocumentChanged);
    window.onDidChangeActiveTextEditor(this.updateEditedWarning);
  }

  get treeView() {
    return this.treeDataProvider.treeView;
  }

  // reveal treeView if any node exist
  tryReveal() {
    // try second node first to show the navigation buttons
    const targetNode = this.treeDataProvider.rootNodes[1] || this.treeDataProvider.rootNodes[0];
    if (targetNode) {
      this.treeView.reveal(targetNode, { focus: true });
    }
  }

  refresh = () => {
    this.treeDataProvider.refresh();
    this.updateEditedWarning();
  }
  refreshOnData = () => {
    this.refresh();
    this.tracesAtCursor.needRefresh = true;
    this.tracesAtCursor.updateSelectTraceAtCursorButton();
    this.errorTraceManager.refresh();
  }

  // refreshOnData = makeDebounce(() => {
  //   this.refresh();
  //   this.tracesAtCursor.needRefresh = true;
  //   this.tracesAtCursor.updateSelectTraceAtCursorButton();
  //   this.errorTraceManager.refresh();
  // }, 200);

  selectTraceAtCursor = () => {
    let trace = this.tracesAtCursor.get();
    if (traceSelection.selected === trace) {
      this.tracesAtCursor.next();
      trace = this.tracesAtCursor.get();
    }
    if (trace) {
      traceSelection.selectTrace(trace, 'selectTraceAtCursor');
      emitSelectTraceAction(trace);
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
    // ########################################
    // hook up event handlers
    // ########################################

    // click event listener
    this.treeDataProvider.initDefaultClickCommand(context);

    // data changed
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.refreshOnData();
      for (const app of selectedApps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('traces', this.refreshOnData)
        );
      }
    });

    // add traceSelection event handler
    traceSelection.onTraceSelectionChanged((/* selected */) => {
      this.refresh();
      this.tryReveal();
    });
  }

  /** ###########################################################################
   * error
   *  #########################################################################*/

  showError() {
    this.errorTraceManager.showError();
  }

  /** ###########################################################################
   * edited warning
   *  #########################################################################*/

  handleDocumentChanged = async (activeTextEditor) => {
    if (!activeTextEditor) {
      return;
    }

    const changedFileName = activeTextEditor.document.fileName;
    const affectedAppIds = getRelatedAppIds(changedFileName);
    for (const appId of affectedAppIds) {
      if (!this.documentChangedByAppId.get(appId)) {
        this.documentChangedByAppId.set(appId, new Set());
      }
      this.documentChangedByAppId.get(appId).add(changedFileName);
    }
    this.updateEditedWarning(activeTextEditor);
  }

  updateEditedWarning = (activeTextEditor = window.activeTextEditor) => {
    const selectedApplicationId = traceSelection.selected?.applicationId;
    if (this.documentChangedByAppId.get(selectedApplicationId)?.has(activeTextEditor?.document.fileName)) {
      this.setWarning(true);
    }
    else {
      this.setWarning(false);
    }
  }

  setWarning(edited) {
    if (edited !== this.edited) {
      this.edited = edited;
      if (edited) {
        this.treeDataProvider.decorateTitle(`⚠️`);
      }
      else {
        this.treeDataProvider.resetTitle();
      }
      commands.executeCommand('setContext', 'dbuxTraceDetailsView.context.editedWarning', edited);
    }
  }

  async showEditedWarning() {
    const message = 'Warning: Document changed -> code decorations might be inaccurate';
    await showWarningMessage(message, null, { modal: true });
  }
}

// ###########################################################################
// init
// ###########################################################################

/**
 * @param {ExtensionContext} context 
 */
export function initTraceDetailsView(context) {
  controller = new TraceDetailsController(context);
  controller.initOnActivate(context);

  // refresh right away
  controller.refresh();

  return controller;
}