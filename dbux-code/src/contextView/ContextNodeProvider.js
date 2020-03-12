import { newLogger } from 'dbux-common/src/log/logger';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';
import Trace from 'dbux-common/src/core/data/Trace';
import allApplications from 'dbux-data/src/applications/allApplications';
import { makeRootTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import ContextNode, { EmptyNode } from './ContextNode';

const { log, debug, warn, error: logError } = newLogger('ContextNodeProvider');

export class ContextNodeProvider {
  _rootNodes: Array<ContextNode>;
  _contextNodesByApp: Array<Array<ContextNodes>>

  constructor(onChangeEventEmitter) {
    this.onChangeEventEmitter = onChangeEventEmitter;
    this.onDidChangeTreeData = onChangeEventEmitter.event;
    this._rootNodes = [];
    this._contextNodesByApp = [];

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
    const allContextNode = allFisrtTraces.map(this.getContextNodeByTrace);
    this._rootNodes = allContextNode.reverse();
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
  getContextNodeByTrace = (trace) => {
    const { applicationId, runId, traceId } = trace;
    if (!this._contextNodesByApp[applicationId]) {
      this._contextNodesByApp[applicationId] = [];
    }

    // build node if not exist
    if (!this._contextNodesByApp[applicationId][runId]) {
      const { contextId } = this.getContextByTrace(trace);
      const app = allApplications.getById(applicationId);
      const label = makeRootTraceLabel(trace, app);

      const newNode = new ContextNode(
        label,
        applicationId,
        runId,
        contextId,
        traceId,
        this
      );

      this._contextNodesByApp[applicationId][runId] = newNode;
    }
    return this._contextNodesByApp[applicationId][runId]
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
   * @param {ContextNode} node
   */
  getTreeItem = (node) => {
    return node;
  }

  /**
   * @param {ContextNode} node
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
   * @param {ContextNode} node
   */
  getParent = (node) => {
    return node.parentNode;
  }
}