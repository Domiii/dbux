import { newLogger } from 'dbux-common/src/log/logger';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import Trace from 'dbux-common/src/core/data/Trace';
import allApplications from 'dbux-data/src/applications/allApplications';
import { makeRootTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import CallRootNode, { EmptyNode } from './CallRootNode';

const { log, debug, warn, error: logError } = newLogger('CallGraphNodeProvider');

export class CallGraphNodeProvider {
  _rootNodes: Array<CallRootNode>;
  _rootNodesByApp: Array<Array<CallRootNode>>

  constructor(onChangeEventEmitter) {
    this.onChangeEventEmitter = onChangeEventEmitter;
    this.onDidChangeTreeData = onChangeEventEmitter.event;
    this._rootNodes = [];
    this._rootNodesByApp = [];

    allApplications.selection.onApplicationsChanged(this._handleApplicationsChanged);
  }

  refreshView = () => {
    this.onChangeEventEmitter.fire();
  }

  _update = (applicationId: number, newContextData: Array<ExecutionContext>) => {
    // TODO: [performance] can we incrementally add new contexts only?
    this._updateAll();
  }

  _updateAll = () => {
    const allFisrtTraces = allApplications.selection.data.firstTracesInOrder.getAll();
    const allRootNode = allFisrtTraces.map(this.getRootNodeByTrace);
    this._rootNodes = allRootNode.reverse();
    this.refreshView();
  }

  _handleApplicationsChanged = (apps) => {
    this._updateAll();
    for (const app of apps) {
      allApplications.selection.subscribe(
        app.dataProvider.onData('executionContexts', this._update)
      );
    }
  }

  // ########################################
  // Util
  // ########################################

  /**
   * @param {Trace} trace
   */
  getRootNodeByTrace = (trace) => {
    const { applicationId, runId, traceId } = trace;
    if (!this._rootNodesByApp[applicationId]) {
      this._rootNodesByApp[applicationId] = [];
    }

    // build node if not exist
    if (!this._rootNodesByApp[applicationId][runId]) {
      const { contextId } = this.getContextByTrace(trace);
      const app = allApplications.getById(applicationId);
      const label = makeRootTraceLabel(trace, app);

      const newNode = new CallRootNode(
        label,
        applicationId,
        runId,
        contextId,
        traceId,
        this
      );

      this._rootNodesByApp[applicationId][runId] = newNode;
    }
    return this._rootNodesByApp[applicationId][runId];
  }

  /**
   * @param {Trace} trace 
   */
  getContextByTrace(trace) {
    const { dataProvider } = allApplications.getById(trace.applicationId);
    return dataProvider.collections.executionContexts.getById(trace.contextId);
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