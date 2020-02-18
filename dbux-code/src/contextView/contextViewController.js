import { window, EventEmitter } from 'vscode';
import traceSelection from 'dbux-data/src/traceSelection';
import { newLogger } from 'dbux-common/src/log/logger';
import { ContextNodeProvider } from './ContextNodeProvider';
import ContextNode from './ContextNode';
import allApplications from 'dbux-data/src/applications/allApplications';

const { log, debug, warn, error: logError } = newLogger('ContextViewController');

export class ContextViewController {
  constructor(viewId, options) {
    this.onChangeEventEmitter = new EventEmitter();
    this.contextNodeProvider = new ContextNodeProvider(this.onChangeEventEmitter);
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
    const node = this.contextNodeProvider._contextNodesByApp[applicationId][contextId];
    this._revealByContextNode(node, expand);
  }

  // deprecated
  gotoPreviousContext = () => {
    const node = this._getPreviousNode();
    if (!node) return;
    this.lastSelectedNode = node;
    node.gotoCode();
    this._revealByContextNode(node);
  }

  // deprecated
  gotoNextContext = () => {
    const node = this._getNextNode();
    if (!node) return;
    this.lastSelectedNode = node;
    node.gotoCode();
    this._revealByContextNode(node);
  }

  // ###########################################################################
  // Private methods
  // ###########################################################################

  /**
   * @param {ContextNode} node
   */
  _revealByContextNode = (node, expand = false) => {
    this.contextView.reveal(node, { expand });
  }

  // deprecated
  _getPreviousNode = () => {
    const lastNode = this.contextView.selection[0] || this.lastSelectedNode;
    if (!lastNode) return this.contextNodeProvider._rootNodes[0] || null;
    let id = lastNode.contextId;
    if (id !== 1) id -= 1;
    return this.contextNodeProvider.nodesByApp[id];
  }

  // deprecated
  _getNextNode = () => {
    const lastNode = this.contextView.selection[0] || this.lastSelectedNode;
    if (!lastNode) return this.contextNodeProvider._rootNodes[0] || null;
    let id = lastNode.contextId;
    if (id !== this.contextNodeProvider.nodesByApp.length) id += 1;
    return this.contextNodeProvider.nodesByApp[id];
  }
}

let contextViewController: ContextViewController;

export function initContextView() {
  contextViewController = new ContextViewController('dbuxContextView', {
    canSelectMany: false,
    showCollapseAll: true
  });

  return contextViewController;
}