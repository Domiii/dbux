import { EventEmitter } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import allApplications from 'dbux-data/src/applications/allApplications';
import CallRootNode, { EmptyNode } from './CallRootNode';

const { log, debug, warn, error: logError } = newLogger('CallGraphNodeProvider');

export class CallGraphNodeProvider {
  _rootNodesByApp: Array<Array<CallRootNode>> = [];
  constructor(viewController) {
    this._onChangeEventEmitter = new EventEmitter();
    this.onDidChangeTreeData = this._onChangeEventEmitter.event;
    this.callGraphViewController = viewController;
  }

  refresh = () => {
    const allFisrtTraces = allApplications.selection.data.firstTracesInOrder.getAll();
    const allRootNode = allFisrtTraces.map(this._getRootNodeByTrace);
    this._rootNodes = allRootNode.reverse();

    // tell vscode to refresh view
    this._onChangeEventEmitter.fire();
  }

  // ########################################
  // Util
  // ########################################

  /**
   * @param {Trace} trace
   */
  _getRootNodeByTrace = (trace) => {
    const { applicationId, runId } = trace;

    if (!this._rootNodesByApp[applicationId]) this._rootNodesByApp[applicationId] = [];
    
    // build node if not exist
    if (!this._rootNodesByApp[applicationId][runId]) {
      const newNode = new CallRootNode(trace, this);
      this._rootNodesByApp[applicationId][runId] = newNode;
    }
    // build children
    this._rootNodesByApp[applicationId][runId].updateChildren();
    return this._rootNodesByApp[applicationId][runId];
  }

  // ########################################
  // TreeDataProvider methods
  // ########################################

  /**
   * @param {CallRootNode} node
   */
  getTreeItem = (node) => {
    return node;
  }

  /**
   * @param {CallRootNode} node
   */
  getChildren = (node) => {
    if (node) {
      return node.children;
    }
    else {
      if (this._rootNodes.length) return this._rootNodes;
      return [EmptyNode];
    }
  }

  /**
   * @param {CallRootNode} node
   */
  getParent = (node) => {
    return node.parentNode;
  }
}