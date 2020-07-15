import { window, EventEmitter } from 'vscode';
import traceSelection from '@dbux/data/src/traceSelection';
import { newLogger } from '@dbux/common/src/log/logger';
import { CallStackNodeProvider } from './CallStackNodeProvider';
import CallStackNode from './CallStackNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('CallGraphViewController');

export class CallStackViewController {
  constructor(viewId, options) {
    this.onChangeEventEmitter = new EventEmitter();
    this.callStackNodeProvider = new CallStackNodeProvider(this);
    this.callGraphView = window.createTreeView(viewId, { 
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
   * @param {CallStackNode} node
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
    this.callGraphView.reveal(node, { expand });
  }
}

/**
 * @type {CallStackViewController}
 */
let callStackViewController;

export function initCallStackView() {
  callStackViewController = new CallStackViewController('dbuxCallStackView', {
    canSelectMany: false,
    showCollapseAll: false
  });

  return callStackViewController;
}