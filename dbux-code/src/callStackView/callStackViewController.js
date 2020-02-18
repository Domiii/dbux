import { window, EventEmitter } from 'vscode';
import traceSelection from 'dbux-data/src/traceSelection';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import { CallStackNodeProvider } from './CallStackNodeProvider';
import CallStackNode from './CallStackNode';

const { log, debug, warn, error: logError } = newLogger('ContextViewController');

export class CallStackViewController {
  constructor(viewId, options) {
    this.onChangeEventEmitter = new EventEmitter();
    this.contextNodeProvider = new CallStackNodeProvider(this.onChangeEventEmitter);
    this.contextView = window.createTreeView(viewId, { 
      treeDataProvider: this.contextNodeProvider,
      ...options
    });
  }

  // ###########################################################################
  // Public methods
  // ###########################################################################

  refresh = () => {
    this.onChangeEventEmitter.fire();
  }

  /**
   * @param {ContextNode} node
   */
  handleItemClick = (node) => {
    // const dp = allApplications.getApplication(node.applicationId).dataProvider;
    // const trace = dp.collections.traces.getById(node.traceId);
    // traceSelection.selectTrace(trace);
  }

  // ###########################################################################
  // Private methods
  // ###########################################################################

  /**
   * @param {CallStackNode} node
   */
  _revealByNode = (node, expand = false) => {
    this.contextView.reveal(node, { expand });
  }
}

let callStackViewController: CallStackViewController;

export function initCallStackView() {
  callStackViewController = new CallStackViewController('dbuxCallStackView', {
    canSelectMany: false,
    showCollapseAll: false
  });

  return callStackViewController;
}