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
    this.callStackNodeProvider = new CallStackNodeProvider(this);
    this.contextView = window.createTreeView(viewId, { 
      treeDataProvider: this.callStackNodeProvider,
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
    traceSelection.selectTrace(node.trace, 'callStackViewController');
  }

  showParent = (node) => {
    this.callStackNodeProvider.showParent(node);
  }

  showScheduler = (node) => {
    this.callStackNodeProvider.showScheduler(node);
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