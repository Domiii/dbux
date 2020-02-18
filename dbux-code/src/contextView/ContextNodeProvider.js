import { newLogger } from 'dbux-common/src/log/logger';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import Trace from 'dbux-common/src/core/data/Trace';
import allApplications from 'dbux-data/src/applications/allApplications';
import ContextNode, { EmptyNode } from './ContextNode';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';

const { log, debug, warn, error: logError } = newLogger('TreeData');

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
    this._rootNodes = allContextNode;
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
      const context = this.getContextByTrace(trace);
      const { contextId, displayName, contextType } = context;

      // TODO: find context.displayName
      let newNode = new ContextNode(
        displayName || ExecutionContextType.getName(contextType),
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