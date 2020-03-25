import { window, EventEmitter } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import { newLogger } from 'dbux-common/src/log/logger';
import { CallGraphNodeProvider } from './CallGraphNodeProvider';
import CallRootNode from './CallRootNode';

const { log, debug, warn, error: logError } = newLogger('CallGraphViewController');

export class CallGraphViewController {
  constructor(viewId, options) {
    this.onChangeEventEmitter = new EventEmitter();
    this.callGraphNodeProvider = new CallGraphNodeProvider(this.onChangeEventEmitter);
    this.callGraphView = window.createTreeView(viewId, { 
      treeDataProvider: this.callGraphNodeProvider,
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
   * @param {CallRootNode} node
   */
  handleItemClick = (node) => {
    const dp = allApplications.getApplication(node.applicationId).dataProvider;
    const trace = dp.collections.traces.getById(node.traceId);
    traceSelection.selectTrace(trace);
  }

  /**
   * If expand = true, expands the children of item.
   * If expand = number, expands the children recursivly(at most 3 levels).
   * @param {number} applicationId
   * @param {number} contextId
   */
  revealByContextId = (applicationId, contextId, expand = false) => {
    const node = this.callGraphNodeProvider._rootNodesByApp[applicationId][contextId];
    this._revealByNode(node, expand);
  }

  // deprecated
  gotoPreviousContext = () => {
    const node = this._getPreviousNode();
    if (!node) return;
    this.lastSelectedNode = node;
    node.gotoCode();
    this._revealByNode(node);
  }

  // deprecated
  gotoNextContext = () => {
    const node = this._getNextNode();
    if (!node) return;
    this.lastSelectedNode = node;
    node.gotoCode();
    this._revealByNode(node);
  }

  // ###########################################################################
  // Private methods
  // ###########################################################################

  /**
   * @param {CallRootNode} node
   */
  _revealByNode = (node, expand = false) => {
    this.callGraphView.reveal(node, { expand });
  }

  // deprecated
  _getPreviousNode = () => {
    const lastNode = this.callGraphView.selection[0] || this.lastSelectedNode;
    if (!lastNode) return this.callGraphNodeProvider._rootNodes[0] || null;
    let id = lastNode.contextId;
    if (id !== 1) id -= 1;
    return this.callGraphNodeProvider.nodesByApp[id];
  }

  // deprecated
  _getNextNode = () => {
    const lastNode = this.callGraphView.selection[0] || this.lastSelectedNode;
    if (!lastNode) return this.callGraphNodeProvider._rootNodes[0] || null;
    let id = lastNode.contextId;
    if (id !== this.callGraphNodeProvider.nodesByApp.length) id += 1;
    return this.callGraphNodeProvider.nodesByApp[id];
  }
}

let callGraphViewController: CallGraphViewController;

export function initCallGraphView() {
  callGraphViewController = new CallGraphViewController('dbuxCallGraphView', {
    canSelectMany: false,
    showCollapseAll: true
  });

  return callGraphViewController;
}