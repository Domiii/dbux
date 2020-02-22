import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import DataProvider from 'dbux-data/src/DataProvider';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';
import allApplications from 'dbux-data/src/applications/allApplications';
import CallStackNode, { EmptyNode, BarrierNode } from './CallStackNode';

const { log, debug, warn, error: logError } = newLogger('CallStackNodeProvider');

export class CallStackNodeProvider {
  _allNodes: Array<CallStackNode>;

  constructor(onChangeEventEmitter) {
    this.onChangeEventEmitter = onChangeEventEmitter;
    this.onDidChangeTreeData = onChangeEventEmitter.event;
    this._allNodes = [];

    traceSelection.onTraceSelectionChanged(this.update);
  }

  // ########################################
  // Public methods
  // ########################################

  /**
   * @param {Trace} trace
   */
  update = (trace) => {
    let currentTrace: Trace;
    let parentTraceId: number;
    let parentTrace: Trace = trace;
    this._allNodes = [];
    if (trace) {
      const dp = allApplications.getApplication(trace.applicationId).dataProvider;
      let lastRunId = null;
      while (parentTrace) {
        currentTrace = parentTrace;
        if (lastRunId && parentTrace.runId !== lastRunId) {
          this._allNodes.push(BarrierNode);
          lastRunId = parentTrace.runId;
        }
        this._allNodes.push(this._createNodeByTrace(dp, currentTrace));

        parentTraceId = this._getParentOrSchedulerTraceId(dp, currentTrace);
        parentTrace = dp.collections.traces.getById(parentTraceId);
      }
    }
    this.refresh();
  }

  refresh = () => {
    this.onChangeEventEmitter.fire();
  }

  // ########################################
  // Private methods
  // ########################################

  /**
   * @param {Trace} trace 
   */
  _getParentOrSchedulerTraceId(dp, trace) {
    // TODO: algorithm for await
    const { contextId } = trace;
    const context = dp.collections.executionContexts.getById(contextId);
    const { parentContextId, schedulerTraceId } = context;
    if (parentContextId) {
      return dp.util.getFirstTraceOfContext(contextId).traceId - 1;
    }
    else if (schedulerTraceId) {
      return schedulerTraceId;
    }
    else return null;
  }

  // ########################################
  // Util
  // ########################################

  /**
   * @param {DataProvider} dp
   * @param {Trace} trace
   */
  _createNodeByTrace = (dp, trace) => {
    const { traceId, staticTraceId, applicationId } = trace;
    const label = makeTraceLabel(trace);

    const context = this._getContextByTrace(trace);
    const app = allApplications.getById(applicationId);
    const contextLabel = makeContextLabel(context, app);
    const fileName = dp.util.getTraceFileName(traceId);
    const { loc } = dp.collections.staticTraces.getById(staticTraceId);
    const { line, column } = loc.start;
    const description = `${contextLabel} @${fileName}:${line}:${column}`;

    const newNode = new CallStackNode(
      label,
      description,
      applicationId,
      traceId,
      this
    );

    return newNode;
  }

  /**
   * @param {Trace} trace 
   */
  _getContextByTrace(trace) {
    const { dataProvider } = allApplications.getById(trace.applicationId);
    return dataProvider.collections.executionContexts.getById(trace.contextId);
  }

  // ########################################
  // TreeDataProvider methods
  // ########################################

  /**
   * @param {CallStackNode} node
   */
  getTreeItem(node) {
    return node;
  }

  /**
   * @param {CallStackNode} node
   */
  getChildren(node) {
    if (node) {
      return node.children;
    }
    else {
      if (this._allNodes.length) return this._allNodes;
      return [EmptyNode];
    }
  }

  /**
   * @param {CallStackNode} node
   */
  getParent(node) {
    return node.parentNode;
  }
}