import { commands, ExtensionContext, TreeItemCollapsibleState, window, workspace } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';
import NestedError from '@dbux/common/src/NestedError';
import { throttle } from '@dbux/common/src/util/scheduling';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { emitTraceUserAction } from '../userActions';
import { getRelatedAppIds } from '../codeDeco/editedWarning';
import { showWarningMessage } from '../codeUtil/codeModals';
import TraceDetailsNodeProvider from './TraceDetailsNodeProvider';
import { getOrCreateTracesAtCursor } from '../codeUtil/TracesAtCursor';
import { ExecutionsTDNodeContextValue } from './nodes/ExecutionsTDNodes';
import { NavigationNodeContextValue } from './nodes/NavigationNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('traceDetailsController');

let controller;

class TraceDetailsController {
  constructor(context) {
    this.treeDataProvider = new TraceDetailsNodeProvider();
    this.treeDataProvider.controller = this;
    this.tracesAtCursor = getOrCreateTracesAtCursor(context);

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

  async setFocus() {
    try {
      if (!this.treeView.visible) {
        // don't focus if treeView not visible
        return;
      }
      const executionsTDNode = this.treeDataProvider.rootNodes.find(node => node.contextValue === ExecutionsTDNodeContextValue);
      const navigationNode = this.treeDataProvider.rootNodes.find(node => node.contextValue === NavigationNodeContextValue);
      if (executionsTDNode && navigationNode) {
        if (executionsTDNode.collapsibleState === TreeItemCollapsibleState.Expanded) {
          /**
           * We have to select `NavigationNode` manually to show the buttons, VSCode API does not support persistant buttons
           * @see https://github.com/microsoft/vscode/issues/78829
           * NOTE: we can call the command `${this.treeDataProvider.treeViewName}.focus` to only show view but not the nodes.
           */
          await this.treeView.reveal(navigationNode, { select: true });
          await sleep();
          const selectedExecutionNode = executionsTDNode.getSelectedChild();
          if (selectedExecutionNode) {
            await this.treeView.reveal(selectedExecutionNode, { select: false });
          }
        }
        else {
          await this.treeView.reveal(navigationNode, { focus: true });
        }
      }
    }
    catch (err) {
      const wrappedError = new NestedError(`Failed to focus on TraceTDView`, err);
      logError(wrappedError);
    }
  }

  handleTraceSelectionChanged = throttle(async () => {
    await this.refresh();
    await this.setFocus();
  }, 50)

  refresh = () => {
    const refreshPromise = this.treeDataProvider.refresh();
    this.updateEditedWarning();
    return refreshPromise;
  }

  /**
   * TODO: bring back debounce
   */
  refreshOnData = () => {
    this.refresh();
    this.tracesAtCursor.needRefresh = true;
    this.tracesAtCursor.updateSelectTraceAtCursorButton();
  }

  // refreshOnData = throttle(() => {
  //   this.refresh();
  //   this.tracesAtCursor.needRefresh = true;
  //   this.tracesAtCursor.updateSelectTraceAtCursorButton();
  // }, 200);

  selectTraceAtCursor = () => {
    let trace = this.tracesAtCursor.get();
    if (traceSelection.selected === trace) {
      this.tracesAtCursor.next();
      trace = this.tracesAtCursor.get();
    }
    if (trace) {
      traceSelection.selectTrace(trace, 'selectTraceAtCursor');
      emitTraceUserAction(UserActionType.SelectTrace, trace);
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
    traceSelection.onTraceSelectionChanged(this.handleTraceSelectionChanged);
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